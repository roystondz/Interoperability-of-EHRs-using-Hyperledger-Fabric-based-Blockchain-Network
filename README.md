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
> Should be running during the entire project to ensure Blockchain Transactions occur properly

#### 1.Install the Fabric Samples
> Run this command in BASH Terminal
```bash
$ chmod +x ./install.sh
$ ./install.sh  
```

#### 2.Register the admins for the organisations
```bash
cd ./server-node-sdk
#install the node modules
$ npm i
```

#### 3.Start the network

##### MacOS & Windows
```bash
$ cd ./fabric-samples/test-network

$ ./network.sh up createChannel -ca -s couchdb
```

#### 4.Deploy the chaincode
```bash
$ ./network.sh deployCC -ccn ehrChainCode -ccp ../asset-transfer-basic/chaincode-javascript/ -ccl javascript

#ehrChaincode is the name of the CHAINCODE and the following path
```

##### 5.Register Org Admins
```bash
$ cd server-node-sdk/
$ node cert-scripts/registerOrg1Admin.js
```


#### 6.Run the backend
```bash
$ node app.js
```

#### To shut down the network
```bash
$ ./network.sh down
```

> Run the commands as specified

# API Enpoints

| **Method** | **Endpoint**                | **Description**                          | **Role**         | **Parameters (Body / Query)**                                          |
| ---------- | --------------------------- | ---------------------------------------- | ---------------- | ---------------------------------------------------------------------- |
| `GET`      | `/status`                   | Check server status                      | Public           | –                                                                      |
| `POST`     | `/registerHospital`         | Register a new hospital                  | HospitalAdmin    | `adminId`, `hospitalId`, `name`, `city`                                |
| `POST`     | `/registerDoctor`           | Register a new doctor                    | Hospital         | `hospitalId`, `doctorId`, `hospitalName`, `name`, `department`, `city` |
| `POST`     | `/registerPatient`          | Register a new patient                   | Doctor           | `doctorId`, `patientId`, `hospitalName`, `name`, `dob`, `city`         |
| `POST`     | `/login`                    | Login as a user                          | Any              | `userId`                                                               |
| `POST`     | `/addRecord`                | Add a medical record                     | Doctor           | `doctorId`, `patientId`, `diagnosis`, `prescription`                   |
| `POST`     | `/getAllRecordsByPatientId` | Fetch all records of a patient           | Doctor / Patient | `userId`, `patientId`                                                  |
| `POST`     | `/getRecordById`            | Get a specific medical record            | Doctor / Patient | `userId`, `patientId`, `recordId`                                      |
| `POST`     | `/queryHistoryOfAsset`      | View record history                      | Doctor / Patient | `userId`, `recordId`                                                   |
| `POST`     | `/grantAccess`              | Grant doctor access to records           | Patient          | `patientId`, `doctorIdToGrant`, `hospitalId`                           |
| `POST`     | `/revokeAccess`             | Revoke doctor's access                   | Patient          | `userId`, `patientId`, `doctorId`                                      |
| `POST`     | `/getAccessList`            | List doctors with access                 | Patient          | `userId`, `patientId`                                                  |
| `POST`     | `/getPatientsForDoctor`     | List all patients a doctor has access to | Doctor           | `doctorId`                                                             |
| `POST`     | `/updatePatientProfile`     | Update patient profile                   | Patient          | `userId`, `name`, `dob`, `city`                                        |
| `POST`     | `/fetchLedger`              | View full ledger (audit)                 | Admin            | `userId`                                                               |
| `GET`      | `/getSystemStats`           | View system-wide stats                   | Admin            | `userId` *(as query param)*                                            |




> Not preferred (only for backup)
#### Running via the chaincode folder
```bash
 $ ./network.sh deployCC -ccn ehrChainCode -ccp ../../chaincode -ccl javascript
```


#### Incase of Error : Cannot detect command
> Run in terminal
```bash
CORE_CHAINCODE_BUILDER=hyperledger/fabric-nodeenv:2.5
```

> Read Operations are made through query.js
> Write Operations are made through invoke.js
> Backend established in a separate Repo