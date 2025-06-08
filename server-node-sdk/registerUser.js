'use strict'

const FabricCAServices = require('fabric-ca-client');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function main() {
    try{
        const ccpPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { trustedRoots: [], verify: false }, caInfo.caName);

        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const userExists = await wallet.get('user4');
        if (userExists) {
            console.log('An identity for the user "user4" already exists in the wallet');
            return;
        }

        const adminExists = await wallet.get('admin');
        if (!adminExists) {
            console.log('An identity for the admin user "admin" does not exist in the wallet. Register the admin user first.');
            return;
        }

        
        const provider = await wallet.getProviderRegistry().getProvider(adminExists.type);
        const adminIdentity = await provider.getUserContext(adminExists, 'admin');

        const secret = await ca.register({
            affiliation: 'org1.department1',
            enrollmentID: 'user4',
            role: 'client',
            attrs:[{
                name: 'role',
                value: 'user',
                ecert: true
            },
            {
                name: 'userId',
                value: 'user4',
                ecert: true
            }]
        }, adminIdentity);



        const enrollment = await ca.enroll({
            enrollmentID: 'user4',
            enrollmentSecret: secret,
            attr_reqs: [
                {
                    name: 'role',
                    optional: false
                },
                {
                    name: 'userId',
                    optional: false
                }
            ]
        });
        
        const identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('user4', identity);
        console.log('Successfully registered user "user4" and imported it into the wallet');

        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'user4',
            discovery: { enabled: true, asLocalhost: true },
        });

        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('test01');
        //const res = await contract.submitTransaction('InitLedger');
        const result = await contract.evaluateTransaction('GetAllAssets');
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
        gateway.disconnect();
    }catch (error) {
        console.error(`Failed to register user "user4": ${error}`);
        process.exit(1);
    }
}

main()