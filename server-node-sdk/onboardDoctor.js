'use strict'

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const FabricCAServices = require('fabric-ca-client');

async function main() {
    try{

        const ccpPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
        const ca = new FabricCAServices(caURL);

        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`✅ Wallet path: ${walletPath}`);

        const userIdentity = await wallet.get('Rama');
        if(userIdentity) {
            console.log('ℹ️  User "Rama" already exists in the wallet');
            return;
        }

        const adminIdentity = await wallet.get('hospitalAdmin');
        if (!adminIdentity) {
            console.error('❌ Admin user "hospitalAdmin" does not exist in the wallet. Please enroll the admin first.');
            return;
        }

        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'hospitalAdmin');

        const secret = await ca.register({
            affiliation: 'org1.department1',
            enrollmentID: 'Rama',
            role: 'client',
            attrs:[{
                name: 'role',
                value: 'doctor',
                ecert: true
            },
            {
                name: 'uuid',
                value: 'D001',
                ecert: true
            }]
        }, adminUser);

        const enrollment = await ca.enroll(
            { enrollmentID: 'Rama', enrollmentSecret: secret ,
                attr_reqs: [
                    { name: 'role', optional: false },
                    { name: 'uuid', optional: false }
                ]
            }
        );

        const identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        await wallet.put('Rama', identity);
        console.log('✅ Successfully registered and enrolled user "Rama" and imported it into the wallet');

        // Optionally, you can also create a gateway connection to test the identity
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'Rama',
            discovery: { enabled: true, asLocalhost: true },
        });
        console.log('✅ Gateway connection established for user "Rama"');

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('test01');

        const res = await contract.submitTransaction('InitLedger');
        console.log(`✅ Transaction has been submitted, result is: ${res.toString()}`);

        const allRecords = await contract.evaluateTransaction('GetAllAssets');
        console.log(`✅ All records: ${allRecords.toString()}`);

        
    }catch (error) {
        console.error(`❌ Error: ${error}`);
        process.exit(1);
    }
}