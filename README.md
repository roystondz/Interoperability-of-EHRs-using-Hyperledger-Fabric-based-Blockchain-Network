# Electronic Health Record Blockchain Based Platfrom - Project


## 🧩 Overview
This project provides a decentralized solution for managing and sharing Electronic Health Records securely across different healthcare stakeholders such as hospitals, labs, pharmacies, researchers, patients, and insurance providers.

It leverages:

- Hyperledger Fabric for permissioned blockchain
- IPFS for decentralized file storage (for large medical files)
- Node.js for backend and blockchain interaction
- Next.js for frontend

### ✨ Features
- ✔️ Add/view/update EHRs on blockchain
- 🔐 Role-based access control (patient, doctor, admin, etc.)
- 🧾 Immutable transaction records
- 📦 IPFS for large data like scans/images
- 📊 Real-time status and dashboard for stakeholders
- 🔎 Audit trails and data provenance

### Architecture
```bash
[Frontend - Next.js]
       |
[Node.js Backend API]
       |
[Fabric SDK] --> [Hyperledger Fabric Network]
       |
     [IPFS]

```
### 🚀 Prerequisites

> Ensure the following are installed:

| Software | Version | Command to Check |
|----------|---------|------------------|
| Docker & Docker Compose | ≥ 20.x | `docker -v`, `docker compose version` |
| Node.js & npm | ≥ 16.x | `node -v`, `npm -v` |
| Go | ≥ 1.20 | `go version` |
| Git | Latest | `git --version` |
| Hyperledger Fabric Binaries | 2.5.x | `peer version` |
| jq (for shell scripts) | Latest | `jq --version` |


### Steps to run the project

#### Start docker before running the project

#### 1.Install the Fabric Samples
```bash
chmod +x ./install.sh
./install.sh
```

#### 2.Register the admins for the organisations
```bash
cd ./server-node-sdk
#install the node modules
npm i
#Repeat the process to register all the admins
node registerOrg1Admin.js
```

#### 3.Start the network
```bash
cd ./fabric-samples/test-network

./network.sh up createChannel -ca -s couchdb
```

#### 4.Deploy the chaincode
```bash
./network.sh deployCC -ccn ehrChainCode -ccp ../asset-transfer-basic/chaincode-javascript/ -ccl javascript

#ehrChaincode is the name of the CHAINCODE and the following path
```

#### To shut down the network
```bash
./network.sh down
```

##### Register Org Admins
```bash
$ cd server-node-sdk/
$ node cert-scripts/registerOrg1Admin.js
$ node cert-scripts/registerOrg2Admin.js
```

##### Onboard Scripts
```bash
$ node cert-scripts/onboardHospital01.js
$ node cert-scripts/onboardDoctor.js

$ node cert-scripts/onboardInsuranceCompany.js
$ node cert-scripts/onboardInsuranceAgent.js
```

- Not preferred (only for backup)
#### Running via the chaincode folder
```bash
./network.sh deployCC -ccn ehrChainCode -ccp ../../chaincode -ccl javascript
```

- Read Operations are made through query 
- Write Operations are made through query



