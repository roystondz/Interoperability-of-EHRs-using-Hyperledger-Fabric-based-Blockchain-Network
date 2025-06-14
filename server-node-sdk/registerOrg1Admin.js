'use strict';

const FabricCASerices = require('fabric-ca-client');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function main(){
    try{
        const ccpPath = path.resolve(__dirname,'..','fabric-samples','test-network','organizations','peerOrganizations','org1.example.com','connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCASerices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const adminExists = await wallet.get('hospitalAdmin');
        if (adminExists) {
            console.log('An identity for the admin user "hospitalAdmin" already exists in the wallet');
            return;
        }

        const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
        const identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };
        await wallet.put('hospitalAdmin', identity);
        console.log('Successfully registered and enrolled admin user "hospitalAdmin" and imported it into the wallet');
    }catch (error) {
        console.error(`Failed to register admin user "hospitalAdmin": ${error}`);
        process.exit(1);
    }
}

main()