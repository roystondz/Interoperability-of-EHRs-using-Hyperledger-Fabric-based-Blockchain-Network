'use strict';

const {Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        // load the network configuration
        const ccpPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        // const ccpPath = path.resolve(__dirname, '..', '..','HLF-Alpha_token-Faucet', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA.
        const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
        const ca = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get('Doctor01-Rama');
        if (userIdentity) {
            console.log('An identity for the user "Doctor01-Rama" already exists in the wallet');
            return;
        }

        // Check to see if we've already enrolled the hospitalAdmin user.
        const adminIdentity = await wallet.get('hospitalAdmin');
        if (!adminIdentity) {
            console.log('An identity for the hospitalAdmin user "hospitalAdmin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'hospitalAdmin');

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({
            affiliation: 'org1.department1',
            enrollmentID: 'Doctor01-Rama',
            role: 'client',
            attrs: [{ name: 'role', value: 'Doctor', ecert: true },{ name: 'uuid', value: 'Doctor01-Rama', ecert: true }],
        }, adminUser);
        const enrollment = await ca.enroll({
            enrollmentID: 'Doctor01-Rama',
            enrollmentSecret: secret,
            attr_reqs: [{ name: "role", optional: false },{ name: "uuid", optional: false }]
        });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('Doctor01-Rama', x509Identity);
        console.log('Successfully registered and enrolled hospitalAdmin user "Doctor01-Rama" and imported it into the wallet');

        // -----------------------Create Wallet with default balance on ledger------------------ 
                // Create a new gateway for connecting to our peer node.
                const gateway = new Gateway();
                await gateway.connect(ccp, { wallet, identity: 'Hospital01', discovery: { enabled: true, asLocalhost: true } });
        
                // Get the network (channel) our contract is deployed to.
                const network = await gateway.getNetwork('mychannel');
        
                // Get the contract from the network.
                const contract = network.getContract("ehrChainCode");

                let doctorId="Doctor01-Rama";
                let hospitalName="Hospital01-ABC";
                let name="Rama";
                let city="Pune";

                const res = await contract.submitTransaction('onboardDoctor', doctorId, hospitalName, name, city);
                console.log("/n === Onboard Doctor success === /n", res.toString());
        
                const result2 = await contract.evaluateTransaction('GetAllAssets');
                console.log('/n === GetAllAssets === /n', result2.toString());

                // Disconnect from the gateway.
                gateway.disconnect();

    } catch (error) {
        console.error(`Failed to register user "Doctor01-Rama": ${error}`);
        process.exit(1);
      }
}

main();