'use strict';

const fs = require('fs');
const path = require('path');
const FabricCAServices = require('fabric-ca-client');
const { Wallets, Gateway } = require('fabric-network');

const ORG_ID = 'org1';
const MSP_ID = 'Org1MSP';
const CHANNEL_NAME = 'mychannel';
const CHAINCODE_NAME = 'ehrChainCode';

// ----------------- Helper Functions -----------------

// Load network config
const loadCCP = () => {
    const ccpPath = path.resolve(
        __dirname,
        '..',
        'fabric-samples',
        'test-network',
        'organizations',
        'peerOrganizations',
        `${ORG_ID}.example.com`.toLowerCase(),
        `connection-${ORG_ID}.json`.toLowerCase()
    );
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    return ccp;
};

// Create CA client
const getCAClient = (ccp) => {
    const caInfo = ccp.certificateAuthorities[`ca.${ORG_ID.toLowerCase()}.example.com`];
    return new FabricCAServices(caInfo.url);
};

// Create wallet
const getWallet = async () => {
    const walletPath = path.join(process.cwd(), 'wallet');
    return await Wallets.newFileSystemWallet(walletPath);
};

// ----------------- Main Functions -----------------

// 1️⃣ Register & Enroll Hospital (by hospitalAdmin)
const registerHospital = async (adminId, hospitalId, name, city,departments) => {
    const ccp = loadCCP();
    const ca = getCAClient(ccp);
    const wallet = await getWallet();
    
    // Check hospital identity
    const existingHospital = await wallet.get(hospitalId);
    if (existingHospital) return { message: `${hospitalId} already exists` };

    // Get hospitalAdmin identity
    const adminIdentity = await wallet.get(adminId);
    if (!adminIdentity) throw new Error(`Admin identity ${adminId} not found`);

    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, adminId);

    // Register hospital
    const secret = await ca.register({
        affiliation: `${ORG_ID}.hospital`,
        enrollmentID: hospitalId,
        role: 'client',
        attrs: [
            { name: 'role', value: 'hospital', ecert: true },
            { name: 'uuid', value: hospitalId, ecert: true },
            {name:'hf.Registrar.Roles', value:'hospital,doctor,client', ecert:true},
            {name:'hf.Registrar.Attributes', value:'*', ecert:true},
        ],
    }, adminUser);

    // Enroll hospital
    const enrollment = await ca.enroll({
        enrollmentID: hospitalId,
        enrollmentSecret: secret,
        attr_reqs: [
            { name: 'role', optional: false },
            { name: 'uuid', optional: false }
        ]
    });

    const x509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes()
        },
        mspId: MSP_ID,
        type: 'X.509'
    };

    await wallet.put(hospitalId, x509Identity);
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: hospitalId, discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);

    const res = await contract.submitTransaction('onboardHospital', JSON.stringify({ hospitalId, name,city, departments }));
    gateway.disconnect();

    return { message: `Hospital ${hospitalId} registered and onboarded successfully`, chaincodeRes: res.toString() };
};

// 2️⃣ Register & Enroll Doctor (by Hospital)
const registerDoctor = async (hospitalId, doctorId, hospitalName, name, department, city) => {
    const ccp = loadCCP();
    const ca = getCAClient(ccp);
    const wallet = await getWallet();

    // Check doctor identity
    const existingDoctor = await wallet.get(doctorId);
    if (existingDoctor) return { message: `${doctorId} already exists` };

    // Get hospital identity
    const hospitalIdentity = await wallet.get(hospitalId);
    if (!hospitalIdentity) throw new Error(`Hospital identity ${hospitalId} not found`);

    const provider = wallet.getProviderRegistry().getProvider(hospitalIdentity.type);
    const hospitalUser = await provider.getUserContext(hospitalIdentity, hospitalId);

    // Register doctor
    const secret = await ca.register({
        enrollmentID: doctorId,
        role: 'client',
        attrs: [
            { name: 'role', value: 'doctor', ecert: true },
            { name: 'uuid', value: doctorId, ecert: true },
            { name: 'department', value: department, ecert: true }
        ],
        affiliation: `${ORG_ID}.hospital.doctor`
    }, hospitalUser);

    // Enroll doctor
    const enrollment = await ca.enroll({
        enrollmentID: doctorId,
        enrollmentSecret: secret,
        attr_reqs: [
            { name: 'role', optional: false },
            { name: 'uuid', optional: false },
            { name: 'department', optional: false }
        ]
    });

    const x509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes()
        },
        mspId: MSP_ID,
        type: 'X.509'
    };

    await wallet.put(doctorId, x509Identity);

    // Onboard doctor on ledger
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: hospitalId, discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);

    const res = await contract.submitTransaction('onboardDoctor', JSON.stringify({ doctorId, hospitalName, name, department, city }));
    gateway.disconnect();

    return { message: `Doctor ${doctorId} registered and onboarded successfully`, chaincodeRes: res.toString() };
};

// 3️⃣ Register & Enroll Patient (by Doctor)
const registerPatient = async (hospitalId, patientId, hospitalName, name, dob, city,mobile,gender,breakGlassConsent,age,bloodGroup) => {
    const ccp = loadCCP();
    const ca = getCAClient(ccp);
    const wallet = await getWallet();

    // Check patient identity
    const existingPatient = await wallet.get(patientId);
    if (existingPatient) return { message: `${patientId} already exists` };

    // Get doctor identity
    const hospitalIdentity = await wallet.get(hospitalId);
    if (!hospitalIdentity) throw new Error(`Hospital identity ${hospitalId} not found`);

    const provider = wallet.getProviderRegistry().getProvider(hospitalIdentity.type);
    const hospital = await provider.getUserContext(hospitalIdentity, hospitalId);

    // Register patient
    const secret = await ca.register({
        enrollmentID: patientId,
        role: 'client',
        attrs: [
            { name: 'role', value: 'patient', ecert: true },
            { name: 'uuid', value: patientId, ecert: true }
        ],
        affiliation: `${ORG_ID}.hospital.patient`
    }, hospital);

    // Enroll patient
    const enrollment = await ca.enroll({
        enrollmentID: patientId,
        enrollmentSecret: secret,
        attr_reqs: [
            { name: 'role', optional: false },
            { name: 'uuid', optional: false }
        ]
    });

    const x509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes()
        },
        mspId: MSP_ID,
        type: 'X.509'
    };

    await wallet.put(patientId, x509Identity);

    // Onboard patient on ledger
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: hospitalId, discovery: { enabled: true, asLocalhost: true } });
    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);

    const res = await contract.submitTransaction('onboardPatient', JSON.stringify({ patientId, hospitalName, name, dob, city,mobile,gender,breakGlassConsent,age,bloodGroup }));
    gateway.disconnect();

    return { message: `Patient ${patientId} registered and onboarded successfully`, chaincodeRes: res.toString() };
};

// 4️⃣ Login (check identity exists)
const login = async (userId) => {
    const wallet = await getWallet();
    const identity = await wallet.get(userId);
    if (!identity) return { message: `User ${userId} not found` };
    return { message: `User ${userId} login successful`, userId };
};

const createEmergencyRequest = async (doctorId, patientId, reason) => {
    const ccp = loadCCP();
    const wallet = await getWallet();

    // Verify doctor identity
    if (!await wallet.get(doctorId)) {
        throw new Error(`Doctor ${doctorId} not found`);
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: doctorId,
        discovery: { enabled: true, asLocalhost: true }
    });

    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);

    const requestId = `ER_${Date.now()}`;

    const res = await contract.submitTransaction(
        'createEmergencyRequest',
        JSON.stringify({
            requestId,
            doctorId,
            patientId,
            reason
        })
    );

    gateway.disconnect();

    return {
        message: 'Emergency request submitted and sent to hospital admin',
        requestId,
        status: 'PENDING',
        chaincodeRes: res.toString()
    };
};

const approveEmergencyRequest = async (adminId, requestId) => {
    const ccp = loadCCP();
    const wallet = await getWallet();

    if (!await wallet.get(adminId)) {
        throw new Error(`Admin ${adminId} not found`);
    }

    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: adminId,
        discovery: { enabled: true, asLocalhost: true }
    });

    const network = await gateway.getNetwork(CHANNEL_NAME);
    const contract = network.getContract(CHAINCODE_NAME);

    const res = await contract.submitTransaction(
        'approveEmergencyRequest',
        requestId
    );

    gateway.disconnect();

    return {
        message: 'Emergency request approved',
        requestId,
        chaincodeRes: res.toString()
    };
};

module.exports = { registerHospital, registerDoctor, registerPatient, login ,createEmergencyRequest,approveEmergencyRequest};
