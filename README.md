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

### Steps to run the project

#### 1.Install the Fabric Samples
```bash
chmod +x ./install.sh
./install.sh
```

