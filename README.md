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
[Frontend - React]
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


## Steps to run the project

#### Start docker before running the project
> Should be running during the entire project to ensure Blockchain Transactions occur properly


### Steps for MacOS
#### 1.Install the Fabric Samples
> Run this command in BASH Terminal
```bash
$ chmod +x ./install.sh
$ ./install.sh  
```

#### 2.Install the node modules
```bash
$ cd ./server-node-sdk
#install the node modules
$ npm i
```

#### 3.Start the network
```bash
$ cd ./fabric-samples/test-network
$ ./network.sh up createChannel -ca -s couchdb
```

#### 4.Deploy the chaincode
```bash
$ ./network.sh deployCC -ccn ehrChainCode -ccp ../asset-transfer-basic/chaincode-javascript/ -ccl javascript

#ehrChaincode is the name of the CHAINCODE and the following path
```

##### 5.Register Org Admin (HospitalAdmin)
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

### Steps for Windows
> Instal WSL within the system
- Start WSL and clone the project 
```bash
$ git clone 'repo link'
```

- Then run the install script -> Will install the required Hyperledger binaries
```bash
$ ./install.sh
```

- Open the root folder in VS code
#### 1.Install the node modules
```bash
$ cd ./server-node-sdk
#install the node modules
$ npm i
```

#### 2.Start the network

```bash
$ cd ./fabric-samples/test-network

$ ./network.sh up createChannel -ca -s couchdb
```

#### 3.Deploy the chaincode
```bash
$ ./network.sh deployCC -ccn ehrChainCode -ccp ../asset-transfer-basic/chaincode-javascript/ -ccl javascript

#ehrChaincode is the name of the CHAINCODE and the following path
```

##### 4.Register Org Admin (HospitalAdmin)
```bash
$ cd server-node-sdk/
$ node cert-scripts/registerOrg1Admin.js
```


#### 5.Run the backend
```bash
$ node app.js
```

#### To shut down the network
```bash
$ ./network.sh down
```

## 📌 Frontend Repository

The frontend for this Electronic Health Records (EHR) project is available at the link below:

🔗 **Frontend UI Repository:**  
https://github.com/roystondz/blockchain-frontend

This repository contains the full React-based user interface for all roles:
- Admin  
- Hospital  
- Doctor  
- Patient  

It includes authentication, role-based access control, dashboard components, and API integration with the Fabric blockchain backend.

Make sure to clone both the backend and frontend repositories and configure environment variables properly for smooth setup.


> Run the commands as specified

# API Enpoints

## 🔐 1. Authentication
| Method | Endpoint | Description                                   | Role | Body Parameters |
| ------ | -------- | --------------------------------------------- | ---- | --------------- |
| `POST` | `/login` | Authenticate user & load identity from wallet | Any  | `userId`        |

## 🏥 2. Hospital Management
| Method | Endpoint            | Description                       | Role          | Body Parameters                         |
| ------ | ------------------- | --------------------------------- | ------------- | --------------------------------------- |
| `POST` | `/registerHospital` | Register & onboard a new hospital | HospitalAdmin | `adminId`, `hospitalId`, `name`, `city` |

## 👨‍⚕️ 3. Doctor Management
| Method | Endpoint                | Description                                  | Role     | Body Parameters                                                        |
| ------ | ----------------------- | -------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| `POST` | `/registerDoctor`       | Register & onboard a doctor under a hospital | Hospital | `hospitalId`, `doctorId`, `hospitalName`, `name`, `department`, `city` |
| `POST` | `/getDoctorInfo`        | Fetch logged-in doctor’s profile             | Doctor   | `userId`, `doctorId`                                                   |
| `POST` | `/getPatientsForDoctor` | Get patients the doctor has access to        | Doctor   | `doctorId`                                                             |

## 🧑‍🤝‍🧑 4. Patient Management
| Method | Endpoint                | Description                      | Role    | Body Parameters                                                |
| ------ | ----------------------- | -------------------------------- | ------- | -------------------------------------------------------------- |
| `POST` | `/registerPatient`      | Register & onboard a new patient | Doctor  | `doctorId`, `patientId`, `hospitalName`, `name`, `dob`, `city` |
| `POST` | `/updatePatientProfile` | Update patient profile data      | Patient | `userId`, `name`, `dob`, `city`                                |

## 📄 5. Medical Records Management
| Method | Endpoint                    | Description                              | Role             | Body Parameters                                                       |
| ------ | --------------------------- | ---------------------------------------- | ---------------- | --------------------------------------------------------------------- |
| `POST` | `/addRecord`                | Add a new medical record for a patient   | Doctor           | `doctorId`, `patientId`, `diagnosis`, `prescription`, `report (file)` |
| `POST` | `/getAllRecordsByPatientId` | Get all medical records for a patient    | Doctor / Patient | `userId`, `patientId`                                                 |
| `POST` | `/getRecordById`            | Get a specific medical record            | Doctor / Patient | `userId`, `patientId`, `recordId`                                     |
| `POST` | `/queryHistoryOfAsset`      | View complete record history (audit log) | Doctor / Patient | `userId`, `recordId`                                                  |

## 🔐 6. Access Control (Patient → Doctor)
| Method | Endpoint         | Description                                | Role    | Body Parameters                              |
| ------ | ---------------- | ------------------------------------------ | ------- | -------------------------------------------- |
| `POST` | `/grantAccess`   | Grant a doctor access to medical records   | Patient | `patientId`, `doctorIdToGrant`, `hospitalId` |
| `POST` | `/revokeAccess`  | Revoke access previously granted           | Patient | `userId`, `patientId`, `doctorId`            |
| `POST` | `/getAccessList` | List all doctors who currently have access | Patient | `userId`, `patientId`                        |

## 🧾 7. Ledger & System Information
| Method | Endpoint             | Description                                 | Role        | Params             |
| ------ | -------------------- | ------------------------------------------- | ----------- | ------------------ |
| `POST` | `/fetchLedger`       | Fetch full ledger for audit (admin only)    | Admin       | `userId`           |
| `GET`  | `/getSystemStats`    | View system-wide statistics                 | Admin       | `userId` *(Query)* |
| `GET`  | `/getBlockchainInfo` | Get blockchain height, latest block, hashes | Admin / Dev | –                  |

## 🟢 8. Utility Endpoints
| Method | Endpoint  | Description           | Public | Params |
| ------ | --------- | --------------------- | ------- | ------ |
| `GET`  | `/status` | Backend health status | ✔ Yes   | –      |

#### Notes
> All Hyperledger Fabric network interactions use wallet identities.
> Upload endpoints must use multipart/form-data.
> Role permissions are enforced in both backend & chaincode.
> Query operations use QSCC for blockchain info.


## Incase of containers not forming in docker
#### Stop all containers and remove old network:
```bash
docker ps -a
docker stop $(docker ps -aq)
docker rm $(docker ps -aq)
docker network rm fabric_test
```

#### Prune unused Docker resources (optional, but helps):
```bash
docker system prune -f
docker volume prune -f
```

#### Start network again from a clean state:
```bash
./network.sh up createChannel -ca -s couchdb
```


> Make sure you run this in WSL Ubuntu, not MINGW64.
> Ensure your Fabric binaries are in $PATH in WSL.

-----------------------

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