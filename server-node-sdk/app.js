    'use strict';
    /**
     * Generic Register + Enroll function
     * - hospitalAdmin → register Hospital
     * - hospital → register Doctor
     * - doctor → register Patient
     */

    const express = require('express');
    const helper = require('./helper');
    const invoke = require('./invoke');
    const query = require('./query');
    const cors = require('cors');
    

    const fs = require('fs');
    const multer = require('multer');
    const axios = require('axios');
    const FormData = require('form-data');
    const dotenv = require('dotenv');
    dotenv.config();

    const upload = multer({ dest: 'uploads/' });

    const app = express();
    app.use(express.json());
    // app.use(cors({
    //     origin: "*",
    //     credentials: true,
    // }));

    app.use(cors({
        origin: (origin, callback) => {
            callback(null, origin || "*");
        },
        credentials: true,
    }));
    
    // const https = require('https');

    // const httpsOptions = {
    // key: fs.readFileSync('./server.key'),
    // cert: fs.readFileSync('./server.cert')
    // };
   

    // https.createServer(httpsOptions, app).listen(3000, () => {
    //     console.log("🚀 HTTPS Backend running at https://localhost:3000");
    //   });
    
    app.listen(3000, () => {
        console.log("🚀 HTTP Backend running at http://localhost:3000");
    });

    app.get('/status', async function (req, res, next) {
        res.send("Server is up.");
    });

    app.get('/', async function (req, res, next) {
        res.status(200).send("Welcome to EHR Blockchain Network");
    });

    // app.post('/registerPatient', async function (req, res, next) {
    //     try {
    //         let role; 
    //         let {adminId, doctorId, userId, name, dob, city} = req.body;

    //         // check request body
    //         console.log("Received request:", req.body);
    //         if (req.body.userId && req.body.adminId) {
    //             userId = req.body.userId;
    //             adminId = req.body.adminId;
    //         } else {
    //             console.log("Missing input data. Please enter all the user details.");
    //             throw new Error("Missing input data. Please enter all the user details.");
    //         }
            
    //         role='patient';

    //         //call registerEnrollUser function and pass the above as parameters to the function
    //         const result = await helper.registerUser(adminId, doctorId, userId, role, { name, dob, city});
    //         console.log("Result from user registration function:", result);

    //         // check register function response and set API response accordingly 
    //         res.status(200).send(result);
    //     } catch (error) {
    //         console.log("There was an error while registering the user. Error is ", error);
    //         next(error);
    //     }  
    // });

    app.post('/loginPatient', async function (req, res, next){
        try {
            let userId;

            // check request body        
            if (req.body.userId) {
                userId = req.body.userId;
                
            } else {
                console.log("Missing input data. Please enter all the user details.");
                throw new Error("Missing input data. Please enter all the user details.");
            }

            const result = await helper.login(userId);
            console.log("Result from user login function: ", result);
            //check response returned by login function and set API response accordingly
            res.status(200).send(result);
        } catch (error) {
            console.log("There was an error while logging in. Error is ", error);
            next(error);
        }

    });


    app.post('/queryHistoryOfAsset', async function (req, res, next){
        try {
            //  queryHistory(ctx, Id)
            let userId = req.body.userId;
            let recordId = req.body.recordId;
        
            const result = await query.getQuery('queryHistoryOfAsset',{recordId}, userId);
            // console.log("Response from chaincode", result);
            //check response returned by login function and set API response accordingly
            res.status(200).send(JSON.parse(result.data));
        } catch (error) {       
            next(error);
        }
    });


    // app.post('/addRecord', async function (req, res, next){
    //     try {
    //         //  Only doctors can add records
    //         const {doctorId, patientId, diagnosis, prescription,reportHash} = req.body;
    //         const result = await invoke.invokeTransaction('addRecord', {patientId, diagnosis, prescription,reportHash}, doctorId);
                
    //         res.send({sucess:true, data: result})
                    
    //     } catch (error) {       
    //         next(error);
    //     }
    // });


    //test

    app.post('/addRecord', upload.single('report'), async (req, res, next) => {
        try {
          const { doctorId, patientId, diagnosis, prescription } = req.body;
          const filePath = req.file?.path;
      
          if (!doctorId || !patientId || !diagnosis || !prescription) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
          }
      
          if (!filePath) {
            return res.status(400).json({ success: false, message: 'File missing' });
          }
      
          console.log(`Uploading file ${req.file.originalname} to Pinata...`);
      
       
          const formData = new FormData();
          formData.append('file', fs.createReadStream(filePath));
      
          const pinataRes = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            formData,
            {
              headers: {
                ...formData.getHeaders(),
                pinata_api_key: process.env.PINATA_API_KEY,
                pinata_secret_api_key: process.env.PINATA_API_SECRET,
              },
            }
          );
      
          const ipfsHash = pinataRes.data.IpfsHash;
          console.log('Uploaded to IPFS with hash:', ipfsHash);
      
      
          fs.unlinkSync(filePath);
      // lin to the block chain here 
          const result = await invoke.invokeTransaction(
            'addRecord',
            { patientId, diagnosis, prescription, reportHash: ipfsHash },
            doctorId
          );
      
          res.status(200).json({
            success: true,
            ipfsHash,
            data: result,
          });
        } catch (error) {
          console.error('Error in /addRecord:', error.message);
          next(error);
        }
      });
      

    //

    app.post('/getAllRecordsByPatientId', async function (req, res, next){
        try {
            // getAllRecordsByPatientId(ctx, patientId
            const {userId, patientId} = req.body;  
            const result = await query.getQuery('getAllRecordsByPatientId',{patientId}, userId);

            console.log("Response from chaincode", result);
            res.status(200).send({ success: true, data:result});

        } catch (error) {       
            next(error);
        }
    });

    app.post('/getRecordById', async function (req, res, next){
        try {
            // getRecordById(ctx, patientId, recordId)
            const {userId, patientId, recordId} = req.body;  
            const result = await query.getQuery('getRecordById',{patientId, recordId}, userId);

            console.log("Response from chaincode", result);
            res.status(200).send({ success: true, data:result});

        } catch (error) {       
            next(error);
        }
    });

    // Doctor -> request access
app.post('/doctor/requestAccess', async (req, res, next) => {
    try {
      const { doctorId, patientId, hospitalId, reason } = req.body;
      const result = await invoke.invokeTransaction('requestAccess', { doctorId, patientId, hospitalId, reason }, doctorId);
      res.status(200).send({ success: true, result });
    } catch (err) { next(err); }
  });

  // Get ALL patients (doctor search)
  app.get("/getAllPatients", async (req, res, next) => {
    try {
      const result = await query.getQuery("getAllPatients", {}, "DOC-0101");
      res.status(200).send({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  });
  
  
  app.post('/doctor/checkAccess', async (req, res, next) => {
    try {
      const { doctorId, patientId } = req.body;
  
      const result = await query.getQuery(
        "checkDoctorAccess",
        { doctorId, patientId },
        doctorId
      );
  
      res.status(200).send({ success: true, access: result });
  
    } catch (err) {
      next(err);
    }
  });
  
  
  // Patient -> list requests
  app.post('/patient/getAccessRequests', async (req, res, next) => {
    try {
      const { patientId } = req.body;
      const result = await query.getQuery('getAccessRequests', { patientId }, patientId);
      res.status(200).send({ success: true, data: result });
    } catch (err) { next(err); }
  });
  
  // Patient -> approve/reject
  app.post('/patient/updateAccessRequest', async (req, res, next) => {
    try {
      const { patientId, doctorId, requestId, action } = req.body;
      const result = await invoke.invokeTransaction('updateAccessRequest', { patientId, doctorId, requestId, action }, patientId);
      res.status(200).send({ success: true, result });
    } catch (err) { next(err); }
  });
  

    app.post('/grantAccess', async function (req, res, next){
        try {
            // call this from patient 
            // grantAccess(ctx, patientId, doctorIdToGrant) - call by patient
            const { patientId, doctorIdToGrant,hospitalId} = req.body;  
            const result = await invoke.invokeTransaction('grantAccess',{patientId:patientId, doctorIdToGrant:doctorIdToGrant,hospitalId}, patientId);

            console.log("Response from chaincode", result);
            res.status(200).send({ success: true, data:result});

        } catch (error) {       
            next(error);
        }
    });

    // create Faucet Wallet only admin can call.
    // fetchLedger(ctx, timeStamp, amount, timeDelay)
    app.post('/fetchLedger', async function (req, res, next){
        try {
            let userId = req.body.userId;
            // fetchLedger(ctx)
            const result = await query.getQuery('fetchLedger', {}, userId);
            console.log("Response from chaincode", result);
            //check response returned by login function and set API response accordingly
                res.status(200).send({ success: true, data:result})

        } catch (error) {       
            next(error);
        }
    });
    //new
    app.post('/updatePatientProfile', async (req, res, next) => {
        try {
            const { name, dob, city,breakGlassConsent } = req.body;
            console.log("arguments at invoke: ", req.body);
            // Create an object with the arguments
            const args = { name, dob, city,breakGlassConsent };

            // Call chaincode; invokeTransaction will stringify internally
            const result = await invoke.invokeTransaction('updatePatientProfile', args, req.body.userId);

            res.status(200).send({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    });



    app.post('/revokeAccess', async (req, res, next) => {
        try {
            const { userId, patientId, doctorId } = req.body;
            const result = await invoke.invokeTransaction('revokeAccess', { patientId, doctorId }, userId);
            res.status(200).send({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    });

    app.post('/getAccessList', async (req, res, next) => {
        try {
            const { userId, patientId } = req.body;
    
            if (!userId) {
                return res.status(400).send({
                    success: false,
                    message: "userId is required"
                });
            }
    
            const result = await query.getQuery("getAccessList", { patientId }, userId);
    
            res.status(200).send({
                success: true,
                data: result
            });
        } catch (err) {
            next(err);
        }
    });
    

    // app.post('/getAccessList', async (req, res, next) => {
    //     try {
    //         const { patientId } = req.body;
    //         Console.log("Patient id : ",patientId)
    //         // Call chaincode as the actual patient
    //         const result = await query.getQuery('getAccessList', { patientId }, patientId);
    
    //         res.status(200).send({ success: true, data: result });
    //     } catch (err) {
    //         next(err);
    //     }
    // });
    

    app.post('/getPatientsForDoctor', async (req, res, next) => {
        try {
            const { doctorId } = req.body;
            console.log("Doctor id : ",doctorId)
            const result = await query.getQuery('getPatientsForDoctor', {}, doctorId);
            res.status(200).send({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    });

    app.post('/getSystemStats', async (req, res, next) => {
        try {
            const {userId} = req.body;
            const result = await query.getQuery('getSystemStats', {}, userId);
            res.status(200).send({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    });

    app.post('/getHospitalStats', async (req, res, next) => {
        try {
            const { userId } = req.body;
            const result = await query.getQuery('getHospitalStats', null, userId);
            res.status(200).send({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    });
    

// -------------------- Register Hospital --------------------
app.post('/registerHospital', async (req, res, next) => {
    try {
        const { adminId, hospitalId, name, city,departments } = req.body;
        if (!adminId || !hospitalId || !name || !city) {
            throw new Error('Missing input data for hospital registration.');
        }
        const result = await helper.registerHospital(adminId, hospitalId, name, city,departments);
        res.status(200).send({success: true,result:result});
    } catch (err) {
        next(err);
    }
});

app.post('/getPatientProfile', async (req, res, next) => {
    try {
      const { userId } = req.body;
  
      const result = await query.getQuery('getPatientProfile', {}, userId);
  
      res.status(200).send({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });
  


  app.post('/getDoctorInfo', async (req, res, next) => {
    try {
        const { userId, doctorId } = req.body;

        if (!doctorId) {
            return res.status(400).send({
                success: false,
                message: "doctorId is required"
            });
        }

        const result = await query.getQuery(
            'getDoctor',
            { doctorId },
            userId
        );

        res.status(200).send({ success: true, data: result });

    } catch (err) {
        next(err);
    }
});


// -------------------- Register Doctor --------------------
app.post('/registerDoctor', async (req, res, next) => {
    try {
        const { hospitalId, doctorId, hospitalName, name, department, city } = req.body;
        if (!hospitalId || !doctorId || !hospitalName || !name || !department || !city) {
            throw new Error('Missing input data for doctor registration.');
        }

        const result = await helper.registerDoctor(hospitalId, doctorId, hospitalName, name, department, city);
        res.status(200).send({success:true,result:result});
    } catch (err) {
        next(err);
    }
});

// -------------------- Register Patient --------------------
app.post('/registerPatient', async (req, res, next) => {
    try {
        const { hospitalId, patientId, hospitalName, name, dob, city ,mobile,gender,breakGlassConsent,age,bloodGroup} = req.body;
        if (!hospitalId || !patientId || !hospitalName || !name || !dob || !city) {
            throw new Error('Missing input data for patient registration.');
        }

        const result = await helper.registerPatient(hospitalId, patientId, hospitalName, name, dob, city,mobile,gender,breakGlassConsent,age,bloodGroup);
        res.status(200).send({success:true,result:result});
    } catch (err) {
        next(err);
    }
});

// -------------------- Login --------------------
// app.post('/login', async (req, res, next) => {
//     try {
//         const { userId } = req.body;
//         if (!userId) throw new Error('Missing userId');
//         const result = await helper.login(userId);
//         res.status(200).send({success: true,result:result});
//     } catch (err) {
//         next(err);
//     }
// });

app.post('/login', async (req, res, next) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).send({ success: false, message: "Missing userId" });
      }
  
      const { Wallets } = require("fabric-network");
      const path = require("path");
  
      const walletPath = path.join(process.cwd(), "wallet");
      const wallet = await Wallets.newFileSystemWallet(walletPath);
  
      // 🔍 Check if identity exists
      const identity = await wallet.get(userId);
  
      if (!identity) {
        return res.status(404).send({
          success: false,
          message: `User ${userId} does NOT exist in wallet`
        });
      }
  
      // 🔥 Extract role from X509 attributes
      const certificate = identity.credentials.certificate;
      
      let role = "unknown";
      if (certificate.includes("role=doctor")) role = "doctor";
      if (certificate.includes("role=hospital")) role = "hospital";
      if (certificate.includes("role=patient")) role = "patient";
      if (certificate.includes("role=admin")) role = "admin";
  
      return res.status(200).send({
        success: true,
        message: "Login successful",
        userId,
        role
      });
  
    } catch (err) {
      next(err);
    }
  });
  

// Doctor -> Create Emergency Request
app.post('/doctor/emergency/request', async (req, res, next) => {
    try {
        const { doctorId, patientId, hospitalId, reason } = req.body;

        const result = await invoke.invokeTransaction(
            'createEmergencyRequest',
            { doctorId, patientId, hospitalId, reason },
            doctorId
        );

        res.status(200).send({
            success: true,
            message: "Emergency request sent to hospital admin",
            data: result
        });
    } catch (err) {
        next(err);
    }
});

// Hospital Admin -> View Emergency Requests
app.post('/admin/emergency/all', async (req, res, next) => {
  try {
    const { adminId } = req.body;

    const result = await query.getQuery(
      'getAllEmergencyRequests',
      {},
      adminId
    );

    res.status(200).send({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

app.post('/admin/emergency/requests', async (req, res, next) => {
    try {
        const { adminId } = req.body;

        const result = await query.getQuery(
            'getPendingEmergencyRequests',
            {},
            adminId
        );

        res.status(200).send({
            success: true,
            data: result
        });
    } catch (err) {
        next(err);
    }
});

// Hospital Admin -> Approve / Reject Emergency Request
app.post('/admin/emergency/decision', async (req, res, next) => {
    try {
        const { adminId, requestId, action } = req.body;
        // action: APPROVE or REJECT

        const result = await invoke.invokeTransaction(
            'processEmergencyRequest',
            { requestId, action },
            adminId
        );

        res.status(200).send({
            success: true,
            message: `Emergency request ${action.toLowerCase()}ed`,
            data: result
        });
    } catch (err) {
        next(err);
    }
});


// // Doctor -> Emergency Access Check
// app.post('/doctor/emergency/check', async (req, res, next) => {
//   try {
//     const { doctorId, patientId } = req.body;

//     const result = await query.getQuery(
//       'canDoctorAccessPatient',
//       { doctorId, patientId },
//       doctorId
//     );
//     res.status(200).send({
//       success: true,
//       access: result
//     });
//   } catch (err) {
//     next(err);
//   }
// });

// Doctor -> Get my approved emergency access
app.get('/doctor/emergency/my-access', async (req, res, next) => {
  try {
    const { doctorId } = req.query;   // ✅ NOT req.user

    if (!doctorId) {
      return res.status(400).json({
        success: false,
        message: "doctorId is required"
      });
    }

    const result = await query.getQuery(
      'getMyEmergencyAccess',
      JSON.stringify( doctorId ),   // if chaincode needs args
      doctorId
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
});

app.post('/emergency/revoke', async (req, res, next) => {
  try {
    const { requestId, userId } = req.body;

    if (!requestId || !userId) {
      return res.status(400).json({
        success: false,
        message: 'requestId and userId are required'
      });
    }
    console.log("requestId", requestId);
    console.log("userId", userId);
    const result = await invoke.invokeTransaction(
      'revokeEmergencyAccess',
      { requestId },
      userId
    );

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (err) {
    next(err);
  }
});


app.get('/emergency/requests', async (req, res, next) => {
  try {
    const { status, userId } = req.query;   // ✅ generic
    console.log("status", status);
    console.log("userId", userId);
    if (!status || !userId) {
      return res.status(400).json({
        success: false,
        message: 'status and userId are required'
      });
    }

    const result = await query.getQuery(
      'getEmergencyRequestsByStatus',
      status.toUpperCase(),
      userId
    );

    res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });

  } catch (err) {
    next(err);
  }
});

app.get('/getBlockchainInfo', async (req, res) => {
    try {
      const { Gateway, Wallets } = require("fabric-network");
      const path = require("path");
      const fs = require("fs");
      const fabprotos = require("fabric-protos");
  
      const ccpPath = path.resolve(
        __dirname,
        "..",
        "fabric-samples",
        "test-network",
        "organizations",
        "peerOrganizations",
        "org1.example.com",
        "connection-org1.json"
      );
  
      const ccp = JSON.parse(fs.readFileSync(ccpPath, "utf8"));
      const wallet = await Wallets.newFileSystemWallet(path.join(__dirname, "wallet"));
      const identity = "HOSP-01";
  
      const gateway = new Gateway();
      await gateway.connect(ccp, { wallet, identity, discovery: { enabled: true, asLocalhost: true } });
  
      const network = await gateway.getNetwork("mychannel");
      const qscc = network.getContract("qscc");
  
      // 1️⃣ Get chain info
      const chainInfoBytes = await qscc.evaluateTransaction("GetChainInfo", "mychannel");
      const chainInfo = fabprotos.common.BlockchainInfo.decode(chainInfoBytes);
  
      const height = chainInfo.height.toNumber();
      const latestBlockNumber = height - 1;
  
      // 2️⃣ Get latest block
      const blockBytes = await qscc.evaluateTransaction("GetBlockByNumber", "mychannel", latestBlockNumber.toString());
      const latestBlock = fabprotos.common.Block.decode(blockBytes);
  
      await gateway.disconnect();
  
      return res.json({
        success: true,
        message: "Blockchain info fetched successfully",
        blockchain: {
          height,
          currentBlockHash: chainInfo.currentBlockHash.toString("hex"),
          previousBlockHash: chainInfo.previousBlockHash.toString("hex"),
          latestBlockNumber,
          latestBlock
        }
      });
  
    } catch (error) {
      console.error("Error fetching blockchain info:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch blockchain info",
        error: error.message
      });
    }
  });
  
  
    app.use((err, req, res, next) => {
        res.status(400).send(err.message);
    })