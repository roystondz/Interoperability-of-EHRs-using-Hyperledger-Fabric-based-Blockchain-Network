/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

class ehrChainCode extends Contract {
    //   1. Goverment - network owner - admin access
    //     2. Hospital - Network orgination - Read/Write (doctor data)
    //     3. Practicing physician/Doctor - Read/Write (Patient data w.r.t to hospital)
    //     4. Diagnostics center - Read/Write (Patient records w.r.t to diagnostics center)
    //     5. Pharmacies - Read/Write (Patient prescriptions w.r.t to pharma center)
    //     6. Researchers / R&D - Read data of hospital conect, pateint based on consent. 
    //     7. Insurance companies - Read/Write (Patient claims)
    //     8. Patient - Read/Write (All generated patient data)

    // data structure if patient 

    // patient-001: [{
    //     "patientId": "P001",
    //     "name": "John Doe",
    //     "dob": "1990-01-01",
    //     "authorizedDoctors": ["D001", "D002"]
    //  }]

    // "record-001":[
    //         {
    //         "recordId": "R001",
    //         "doctorId": "D001",
    //         "diagnosis": "Flu",
    //         "prescription": "Rest and hydration",
    //         "timestamp": "2024-01-01T10:00:00Z"
    //         }
    //     ],

    // generate recordId.
    recordIdGenerator(ctx){  
        const txId = ctx.stub.getTxID();  // always unique per transaction
         return `record-${txId}`; 
    }

    async onboardDoctor(ctx, args) {
        const { doctorId, hospitalName, name, city, department } = JSON.parse(args);
        const { role, uuid: callerId } = this.getCallerAttributes(ctx);
    
        if (role !== 'hospital') {
            throw new Error('Only hospital can onboard doctor.');
        }
    
        // FIX: correct key lookup
        const key = `Doctor-${doctorId}`;
        const doctorJSON = await ctx.stub.getState(key);
        if (doctorJSON && doctorJSON.length > 0) {
            throw new Error(`Doctor ${doctorId} already registered by ${callerId}`);
        }
    
        const record = {
            doctorId,
            hospitalId: callerId,
            hospitalName,
            name,
            city,
            department,
            status:'active',
            timestamp: ctx.stub.getTxTimestamp().seconds.low.toString()
        };
    
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(record)));
        return JSON.stringify(record);
    }
    
      
     

    async onboardHospital(ctx, args) {
        const { hospitalId, name, city, departments } = JSON.parse(args);
        const key = `HOSP-${hospitalId}`;
    
        const hospitalJSON = await ctx.stub.getState(key);
        if (hospitalJSON && hospitalJSON.length > 0) {
            throw new Error(`Hospital ${hospitalId} already exists`);
        }
    
        const hospital = { hospitalId, name, city, departments,status:'active', timestamp: ctx.stub.getTxTimestamp().seconds.low.toString() };
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(hospital)));
        return JSON.stringify(hospital);
    }
    
    
    // async onboardDoctor(ctx, args) {
        
    //     const {doctorId, hospitalName, name, city } = JSON.parse(args);
    //     console.log("ARGS-RAW:",args)
    //     console.log("ARGS:",doctorId, hospitalName, name, city)
    //     const { role, uuid: callerId } = this.getCallerAttributes(ctx);
    //     const orgMSP = ctx.clientIdentity.getMSPID();

    //     if (orgMSP !== 'Org1MSP' || role !== 'hospital') {
    //         throw new Error('Only hospital can onboard doc tor.');
    //     }

    //     const doctorJSON = await ctx.stub.getState(doctorId);
    //     if (doctorJSON && doctorJSON.length > 0) {
    //         throw new Error(`Doctor ${doctorId} already registerd by ${callerId}`);
    //     }

    //     const recordId = this.recordIdGenerator(ctx);
    //     console.log("Record ID", recordId);
        
    //     const record = {
    //         recordId,
    //         doctorId,
    //         hospitalId: callerId,
    //         name,
    //         hospitalName,
    //         city,
    //        timestamp: ctx.stub.getTxTimestamp().seconds.low.toString()
    //     };

    //     const result = await ctx.stub.putState(doctorId, Buffer.from(stringify(record)));
    //     console.log('ONBOARD DOCTOR RESULT:',stringify(result))
    //     return stringify(record);
    // }

      // onboard insurance agent by insurance company  
    async onboardInsurance(ctx, args){
        const {agentId, insuranceCompany, name, city} = JSON.parse(args);
        console.log("ARGS-RAW:",args)
        console.log("ARGS-split 4:",agentId, insuranceCompany, name, city)
        const { role, uuid: callerId } = this.getCallerAttributes(ctx);
         const orgMSP = ctx.clientIdentity.getMSPID();

        if (orgMSP !== 'Org2MSP' || role !== 'insuranceAdmin') {
            throw new Error('Only insurance org admin can onbord insurance agent');
        }
        
        const insuranceJSON = await ctx.stub.getState(agentId);
        console.log("INSURANCE DATA",insuranceJSON)
        if (insuranceJSON && insuranceJSON.length > 0) {
            throw new Error(`insurance ${agentId} already registerd by ${callerId}`);
        }

        const recordId = this.recordIdGenerator(ctx);
        console.log("Record ID", recordId);
        
        const record = {
            recordId,
            agentId,
            insuranceId: callerId,
            name,
            insuranceCompany,
            city,
            timestamp: ctx.stub.getTxTimestamp().seconds.low.toString()
        };

        await ctx.stub.putState(agentId, Buffer.from(stringify(record)));
        return stringify(record);
    }

    // this function 
//    async grantAccess(ctx, args) {
//     const {patientId, doctorIdToGrant} = JSON.parse(args);
//     console.log("ARGS-RWA", args)
//     console.log("ARGS", patientId, doctorIdToGrant)
        
//      const { role, uuid: callerId } = this.getCallerAttributes(ctx);

//         if (role !== 'patient') {
//             throw new Error('Only patients can grant access');
//         }

//         if (callerId !== patientId) {
//             throw new Error('Caller is not the owner of this patient record');
//         }

//         const patientJSON = await ctx.stub.getState(patientId);
//         if (!patientJSON || patientJSON.length === 0) {
//             throw new Error(`Patient ${patientId} not found`);
//         }

//         const patient = JSON.parse(patientJSON.toString());

//         if (patient.authorizedDoctors.includes(doctorIdToGrant)) {
//             throw new Error(`Doctor ${doctorIdToGrant} already authorized`);
//         }

//         patient.authorizedDoctors.push(doctorIdToGrant);
//         await ctx.stub.putState(patientId, Buffer.from(stringify(patient)));

//         return `Access granted to doctor ${doctorIdToGrant}`;
//     }

    getCallerAttributes(ctx) {
      const role = ctx.clientIdentity.getAttributeValue('role');
      const uuid = ctx.clientIdentity.getAttributeValue('uuid');

      if (!role || !uuid) {
          throw new Error('Missing role or uuid in client certificate');
      }

      return { role, uuid };
    }

     // add record | only doctor can add record
     // 1. first patient need to grand access to doctor to add record.
    // async addRecord(ctx, patientId, recordId, diagnosis, prescription) {
    //     const { role, uuid: callerId } = this.getCallerAttributes(ctx);

    //     if (role !== 'doctor') {
    //         throw new Error('Only doctors can add records');
    //     }

    //     const patientJSON = await ctx.stub.getState(patientId);
    //     if (!patientJSON || patientJSON.length === 0) {
    //         throw new Error(`Patient ${patientId} not found`);
    //     }

    //     const patient = JSON.parse(patientJSON.toString());

    //     if (!patient.authorizedDoctors.includes(callerId)) {
    //         throw new Error(`Doctor ${callerId} is not authorized`);
    //     }

    //     const record = {
    //         recordId,
    //         doctorId: callerId,
    //         diagnosis,
    //         prescription,
    //        timestamp: ctx.stub.getTxTimestamp().seconds.low.toString()
    //     };

    //     patient.records.push(record);
    //     await ctx.stub.putState(patientId, Buffer.from(stringify(patient)));

    //     return `Record ${recordId} added by doctor ${callerId}`;
    // }

    // async onboardPatient(ctx, args) {
        
    //     const {patientId, name, dob, city} = JSON.parse(args);

    //     console.log("ARGS-RWA", args)
    //     console.log("ARGS-split 4", patientId, name, dob, city)


    //     const key = `patient-${patientId}`;

    //     const existing = await ctx.stub.getState(key);
    //     if (existing && existing.length > 0) {
    //         throw new Error(`Patient ${patientId} already exists`);
    //     }

    //     const patient = {
    //         patientId,
    //         name,
    //         dob,
    //         city,
    //         authorizedDoctors: []
    //     };

    //     await ctx.stub.putState(key, Buffer.from(JSON.stringify(patient)));
    //     return `Patient ${patientId} registered`;
    // }

    async getDoctor(ctx, args) {
        const { doctorId } = JSON.parse(args);
        const key = `Doctor-${doctorId}`;
        const doctorJSON = await ctx.stub.getState(key);
      
        if (!doctorJSON || doctorJSON.length === 0) {
          throw new Error(`Doctor ${doctorId} not found`);
        }
      
        return doctorJSON.toString();
      }
      


    async addRecord(ctx, args) {
        const { patientId, diagnosis, prescription, reportHash } = JSON.parse(args);
        const { role, uuid: callerId } = this.getCallerAttributes(ctx);
    
        if (role !== 'doctor') {
            throw new Error('Only doctors can add records');
        }
    
        const patientKey = `PAT-${patientId}`;
        const patientJSON = await ctx.stub.getState(patientKey);
        if (!patientJSON || patientJSON.length === 0) {
            throw new Error(`Patient ${patientId} not found`);
        }
    
        const patient = JSON.parse(patientJSON.toString());
        if (!patient.authorizedDoctors.includes(callerId)) {
            throw new Error(`Doctor ${callerId} is not authorized for patient ${patientId}`);
        }
    
        const txId = ctx.stub.getTxID();
        const recordId = `R-${txId}`;
        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();
    
        const recordKey = ctx.stub.createCompositeKey('record', [patientId, recordId]);
    
        const record = {
            recordId,
            patientId,
            doctorId: callerId,
            diagnosis,
            prescription,
            reportHash: reportHash || '',
            timestamp
        };
    
        await ctx.stub.putState(recordKey, Buffer.from(JSON.stringify(record)));
        return JSON.stringify({ message: `Record ${recordId} added for patient ${patientId}` });
    }
    
    async getPatientProfile(ctx) {
        const patientId = ctx.clientIdentity.getAttributeValue('uuid');
        const key = `PAT-${patientId}`;
      
        const data = await ctx.stub.getState(key);
      
        if (!data || data.length === 0) {
          throw new Error("Patient not found");
        }
      
        return data.toString();   
      }
      

    async onboardPatient(ctx, args) {
        const { patientId, name, dob, city,mobile,gender,breakGlassConsent,age,bloodGroup} = JSON.parse(args);
        const key = `PAT-${patientId}`;
        const timestamp = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();
        const existing = await ctx.stub.getState(key);
        if (existing && existing.length > 0) {
            throw new Error(`Patient ${patientId} already exists`);
        }
    
        const patient = {
            patientId,
            name,
            dob,
            city,
            mobile,
            gender,
            breakGlassConsent,
            age,
            bloodGroup,
            status:'active',
            timestamp,
            authorizedDoctors: []
        };
    
        await ctx.stub.putState(key, Buffer.from(JSON.stringify(patient)));
        return `Patient ${patientId} registered`;
    }
    
    

    async getAllRecordsByPatientId(ctx, args) {
        const { patientId } = JSON.parse(args);
        const iterator = await ctx.stub.getStateByPartialCompositeKey('record', [patientId]);
        const results = [];
    
        let res = await iterator.next();
        while (!res.done) {
            if (res.value && res.value.value.toString()) {
                const record = JSON.parse(res.value.value.toString('utf8'));
                results.push(record);
            }
            res = await iterator.next();
        }
        await iterator.close();
    
        return JSON.stringify(results);
    }
    

    async getRecordById(ctx, args) {
        const {patientId, recordId} = JSON.parse(args);
        const recordKey = ctx.stub.createCompositeKey('record', [patientId, recordId]);
        const recordJSON = await ctx.stub.getState(recordKey);

        if (!recordJSON || recordJSON.length === 0) {
            throw new Error(`Record ${recordId} not found for patient ${patientId}`);
        }

        return recordJSON.toString();
    }

    // 
    
    async grantAccess(ctx, args) {
        const { patientId, doctorIdToGrant, hospitalId } = JSON.parse(args);
        const { role, uuid: callerId } = this.getCallerAttributes(ctx);
    
        if (role !== 'patient') throw new Error('Only patients can grant access');
        if (callerId !== patientId) throw new Error('Caller is not the owner of this patient record');
    
        const patientKey = `PAT-${patientId}`;
        const patientJSON = await ctx.stub.getState(patientKey);
        if (!patientJSON || patientJSON.length === 0) throw new Error(`Patient ${patientId} not found`);
    
        const patient = JSON.parse(patientJSON.toString());
    
        if (!patient.authorizedDoctors.includes(doctorIdToGrant)) {
            patient.authorizedDoctors.push(doctorIdToGrant);
            await ctx.stub.putState(patientKey, Buffer.from(JSON.stringify(patient)));
    
            const accessKey = ctx.stub.createCompositeKey('access', [patientId, doctorIdToGrant]);
            const accessData = {
                doctorId: doctorIdToGrant,
                hospitalId,
                grantedAt: new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString()
            };
    
            await ctx.stub.putState(accessKey, Buffer.from(JSON.stringify(accessData)));
        }
    
        return JSON.stringify({ message: `Doctor ${doctorIdToGrant} authorized` });
    }
    
    
   async createEmergencyRequest(ctx, payload) {
    const { doctorId, patientId, hospitalId, reason } = JSON.parse(payload);

    if (ctx.clientIdentity.getAttributeValue('role') !== 'doctor') {
        throw new Error('Only doctors can create emergency requests');
    }

    const patientKey = `PAT-${patientId}`;
    const patientBytes = await ctx.stub.getState(patientKey);
    if (!patientBytes || patientBytes.length === 0) {
        throw new Error('Patient not found');
    }

    const patient = JSON.parse(patientBytes.toString());
    if (patient.breakGlassConsent !== true) {
        throw new Error('Patient has not enabled break-glass consent');
    }

    // ✅ DETERMINISTIC TIMESTAMP
    const txTime = ctx.stub.getTxTimestamp();
    const createdAt = new Date(txTime.seconds.low * 1000).toISOString();

    const requestId = `ER_${ctx.stub.getTxID()}`;

    const request = {
        requestId,
        doctorId,
        patientId,
        hospitalId,
        reason,
        status: 'PENDING',
        createdAt
    };

    await ctx.stub.putState(requestId, Buffer.from(JSON.stringify(request)));
    return JSON.stringify(request);
}
async getPendingEmergencyRequests(ctx) {
    if (ctx.clientIdentity.getAttributeValue('role') !== 'hospital') {
        throw new Error('Only hospital admin can view emergency requests');
    }

    const iterator = await ctx.stub.getStateByRange('', '');
const results = [];

let res = await iterator.next();
while (!res.done) {
    if (res.value && res.value.value) {
        try {
            const record = JSON.parse(res.value.value.toString('utf8'));
            if (record.status === 'PENDING') {
                results.push(record);
            }
        } catch (err) {
            // ignore non-JSON states
        }
    }
    res = await iterator.next();
}

await iterator.close();
return JSON.stringify(results);
}

async processEmergencyRequest(ctx, payload) {
    const { requestId, action } = JSON.parse(payload);

    if (ctx.clientIdentity.getAttributeValue('role') !== 'hospital') {
        throw new Error('Only hospital admin can approve requests');
    }

    const reqBytes = await ctx.stub.getState(requestId);
    if (!reqBytes || reqBytes.length === 0) {
        throw new Error('Emergency request not found');
    }

    const request = JSON.parse(reqBytes.toString());

    if (request.status !== 'PENDING') {
        throw new Error('Request already processed');
    }

    request.status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    // ✅ DETERMINISTIC TIMESTAMP - Set before creating access record
    const txTime = ctx.stub.getTxTimestamp();
    request.approvedAt = new Date(txTime.seconds.low * 1000).toISOString();
    request.approvedBy = ctx.clientIdentity.getID();

    if (request.status === 'APPROVED') {

  // 1️⃣ Enforcement key (already exists in your code)
  const accessKey = `EMERGENCY_ACCESS_${request.patientId}_${request.doctorId}`;

  const accessRecord = {
    patientId: request.patientId,
    doctorId: request.doctorId,
    approvedAt: request.approvedAt,
    requestId: request.requestId
  };

  await ctx.stub.putState(
    accessKey,
    Buffer.from(JSON.stringify(accessRecord))
  );

  // 2️⃣ Doctor lookup index (NEW)
  const doctorIndexKey =
    `EMERGENCY_BY_DOCTOR_${request.doctorId}_${request.requestId}`;

  await ctx.stub.putState(
    doctorIndexKey,
    Buffer.from(JSON.stringify(accessRecord))
  );
}

    await ctx.stub.putState(requestId, Buffer.from(JSON.stringify(request)));
    return JSON.stringify(request);
}

async getMyEmergencyAccess(ctx) {
  const doctorId = ctx.clientIdentity.getAttributeValue("uuid");

  if (ctx.clientIdentity.getAttributeValue("role") !== "doctor") {
    throw new Error("Only doctors allowed");
  }

  const iterator = await ctx.stub.getStateByRange(
    `EMERGENCY_BY_DOCTOR_${doctorId}_`,
    `EMERGENCY_BY_DOCTOR_${doctorId}_~`
  );

  const results = [];
  let res = await iterator.next();

  while (!res.done) {
    if (res.value && res.value.value) {
      results.push(JSON.parse(res.value.value.toString("utf8")));
    }
    res = await iterator.next();
  }

  await iterator.close();
  return JSON.stringify(results);
}


async getEmergencyRequestsByStatus(ctx, status) {
  // 🔥 sanitize incoming arg
  status = status.replace(/"/g, '').toUpperCase();

  const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];

  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const iterator = await ctx.stub.getStateByRange('ER_', 'ER_~');

  const results = [];
  let res = await iterator.next();

  while (!res.done) {
    if (res.value && res.value.value) {
      const record = JSON.parse(res.value.value.toString('utf8'));

      if (record.status === status) {
        results.push(record);
      }
    }
    res = await iterator.next();
  }

  await iterator.close();
  return results;
}


    async fetchLedger(ctx) {
        const { role } = this.getCallerAttributes(ctx);
        if (role !== "hospital" && role !== "admin") {
            throw new Error("Unauthorized");
        }
    
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange("", "");
    
        let result = await iterator.next();
        while (!result.done) {
    
            const key = result.value.key.toString();
            const rawValue = result.value.value.toString("utf8");
    
            let parsedValue;
            try { parsedValue = JSON.parse(rawValue); }
            catch { parsedValue = rawValue; }
    
            // Add type detection
            let type = "unknown";
            if (key.startsWith("HOSP-")) type = "hospital";
            else if (key.startsWith("Doctor-")) type = "doctor";
            else if (key.startsWith("PAT-")) type = "patient";
            else if (key.startsWith("record")) type = "record";
    
            allResults.push({
                key,
                type,
                value: parsedValue,
                timestamp: parsedValue.timestamp || null
            });
    
            result = await iterator.next();
        }
    
        await iterator.close();
        return JSON.stringify(allResults);
    }
    

    async getHospitalStats(ctx) {
        const results = [];
    
        // STEP 1 — LOAD ALL HOSPITALS
        const hospitalIterator = await ctx.stub.getStateByRange('HOSP-', 'HOSP-~');
        let hosp = await hospitalIterator.next();
    
        while (!hosp.done) {
            // defensive: check value exists
            if (!hosp.value || !hosp.value.value) {
                hosp = await hospitalIterator.next();
                continue;
            }
    
            const hospital = JSON.parse(hosp.value.value.toString('utf8'));
            const hospitalId = hospital.hospitalId;    // example: HOSP-01
    
            let totalDoctors = 0;
            let totalRecords = 0;
            const patientSet = new Set();
    
            // STEP 2 — LOAD ALL DOCTORS and count those belonging to this hospital
            const docIterator = await ctx.stub.getStateByRange('Doctor-', 'Doctor-~');
            let doc = await docIterator.next();
    
            const doctorsForThisHospital = []; // store doctors for subsequent record counting
    
            while (!doc.done) {
                try {
                    if (doc.value && doc.value.value) {
                        const doctor = JSON.parse(doc.value.value.toString('utf8'));
                        // Prefer explicit hospitalId stored on doctor record (more reliable)
                        const doctorHospitalId = doctor.hospitalId || (() => {
                            // fallback: derive from doctorId if hospitalId isn't present
                            const docId = doctor.doctorId || '';
                            const code = docId.length >= 6 ? docId.substring(4, 6) : null;
                            return code ? `HOSP-${code}` : null;
                        })();
    
                        if (doctorHospitalId === hospitalId) {
                            totalDoctors++;
                            doctorsForThisHospital.push(doctor);
                        }
                    }
                } catch (err) {
                    // ignore malformed doctor entries and continue
                }
                doc = await docIterator.next();
            }
            await docIterator.close();
    
            // STEP 3 — COUNT RECORDS MADE BY THESE DOCTORS
            // Use partial composite key to iterate all 'record' composite keys
            const recordIterator = await ctx.stub.getStateByPartialCompositeKey('record', []);
            let rec = await recordIterator.next();
    
            while (!rec.done) {
                try {
                    if (rec.value && rec.value.value) {
                        const record = JSON.parse(rec.value.value.toString('utf8'));
                        // Match by doctorId against doctorsForThisHospital
                        if (record && record.doctorId) {
                            // faster lookup: create a Set of doctorIds
                            // (create set once outside loop)
                        }
                    }
                } catch (err) {
                    // ignore parse errors
                }
                rec = await recordIterator.next();
            }
            await recordIterator.close();
    
            // A slightly more efficient approach: build doctorId set and then iterate records
            const doctorIdSet = new Set(doctorsForThisHospital.map(d => d.doctorId));
            // re-iterate records to count — (you could combine above but this is clearer)
            const recordIterator2 = await ctx.stub.getStateByPartialCompositeKey('record', []);
            let rec2 = await recordIterator2.next();
            while (!rec2.done) {
                try {
                    if (rec2.value && rec2.value.value) {
                        const record = JSON.parse(rec2.value.value.toString('utf8'));
                        if (record && doctorIdSet.has(record.doctorId)) {
                            totalRecords++;
                            if (record.patientId) patientSet.add(record.patientId);
                        }
                    }
                } catch (err) {}
                rec2 = await recordIterator2.next();
            }
            await recordIterator2.close();
    
            // STEP 4 — BUILD OUTPUT FOR THIS HOSPITAL
            results.push({
                hospitalId,
                name: hospital.name,
                city: hospital.city,
                totalDoctors,
                totalPatients: patientSet.size,
                totalRecords
            });
    
            hosp = await hospitalIterator.next();
        }
    
        await hospitalIterator.close();
        return JSON.stringify(results);
    }
    

    async queryHistoryOfAsset(ctx, args) {
        const {assetId} = JSON.parse(args);
        const iterator = await ctx.stub.getHistoryForKey(assetId);
        const results = [];

        while (true) {
            const res = await iterator.next();

            if (res.value) {
                const tx = {
                    txId: res.value.txId,
                    timestamp: res.value.timestamp ? res.value.timestamp.toISOString() : null,
                    isDelete: res.value.isDelete,
                };

                try {
                    if (res.value.value && res.value.value.length > 0 && !res.value.isDelete) {
                        tx.asset = JSON.parse(res.value.value.toString('utf8'));
                    }
                } catch (err) {
                    tx.asset = null;
                }

                results.push(tx);
            }

            if (res.done) {
                await iterator.close();
                break;
            }
        }

        return results;
    }

    async updatePatientProfile(ctx, args) {
        // args: JSON string with { name, dob, city }
        const { name, dob, city, breakGlassConsent } = JSON.parse(args);
    
        // Get patient id from identity attribute 'uuid' (must be present in cert)
        const patientId = ctx.clientIdentity.getAttributeValue('uuid');
        if (!patientId) {
            throw new Error('Missing uuid attribute in client certificate');
        }
    
        // Use the PAT- prefix consistently
        const userKey = `PAT-${patientId}`;
    
        const data = await ctx.stub.getState(userKey);
        if (!data || data.length === 0) {
            throw new Error('Patient does not exist');
        }
    
        const patient = JSON.parse(data.toString());
        if (name !== undefined) patient.name = name;
        if (dob !== undefined) patient.dob = dob;
        if (city !== undefined) patient.city = city;
        if (breakGlassConsent !== undefined) patient.breakGlassConsent = breakGlassConsent;
    
        await ctx.stub.putState(userKey, Buffer.from(JSON.stringify(patient)));
    
        return JSON.stringify({ message: "Profile updated successfully" });
    }
    
    
    

    async revokeAccess(ctx, args) {
        const { patientId, doctorId } = JSON.parse(args);
    
        if (!patientId || !doctorId) {
            throw new Error("Missing patientId or doctorId");
        }
    
        const { role, uuid } = this.getCallerAttributes(ctx);
        if (role !== "patient") {
            throw new Error("Only patient can revoke access");
        }
    
        if (uuid !== patientId) {
            throw new Error("Caller not authorized");
        }
    
        const accessKey = ctx.stub.createCompositeKey("access", [patientId, doctorId]);
        await ctx.stub.deleteState(accessKey);
    
        // Also remove from patient.authorizedDoctors
        const patientKey = `PAT-${patientId}`;
        const patientJSON = await ctx.stub.getState(patientKey);
        const patient = JSON.parse(patientJSON.toString());
    
        patient.authorizedDoctors = patient.authorizedDoctors.filter(id => id !== doctorId);
    
        await ctx.stub.putState(patientKey, Buffer.from(JSON.stringify(patient)));
    
        return JSON.stringify({ message: "Access revoked" });
    }
    

    async getAccessList(ctx, args) {
        const { patientId } = JSON.parse(args);
        const iterator = await ctx.stub.getStateByPartialCompositeKey('access', [patientId]);
    
        const result = [];
    
        let res = await iterator.next();
        while (!res.done) {
            const data = JSON.parse(res.value.value.toString());
            const doctorId = data.doctorId;
    
            // Fetch doctor info
            const doctorKey = `Doctor-${doctorId}`;
            const doctorJSON = await ctx.stub.getState(doctorKey);
    
            let doctorInfo = {};
            if (doctorJSON && doctorJSON.length > 0) {
                doctorInfo = JSON.parse(doctorJSON.toString());
            }
    
            result.push({
                doctorId: data.doctorId,
                doctorName: doctorInfo.name || "Unknown",
                department: doctorInfo.department || "N/A",
                hospitalName: doctorInfo.hospitalName || "N/A",
                hospitalId: data.hospitalId,
                grantedAt: data.grantedAt
            });
    
            res = await iterator.next();
        }
    
        await iterator.close();
        return JSON.stringify(result);
    }
    
    
    
    async getSystemStats(ctx) {

        const { role } = this.getCallerAttributes(ctx);
    
        if (role !== 'hospital' && role !== 'admin' && role !== 'government') {
            throw new Error("Unauthorized: Only admin/hospital/government can view system stats");
        }
    
        const stats = {
            patients: 0,
            doctors: 0,
            hospitals: 0,
            records: 0
        };
    
        // PATIENTS (Correct prefix)
        let iterator = await ctx.stub.getStateByRange('PAT-', 'PAT-~');
        for (let it = await iterator.next(); !it.done; it = await iterator.next()) {
            stats.patients++;
        }
        await iterator.close();
    
        // DOCTORS
        iterator = await ctx.stub.getStateByRange('Doctor-', 'Doctor-~');
        for (let it = await iterator.next(); !it.done; it = await iterator.next()) {
            stats.doctors++;
        }
        await iterator.close();
    
        // HOSPITALS
        iterator = await ctx.stub.getStateByRange('HOSP-', 'HOSP-~');
        for (let it = await iterator.next(); !it.done; it = await iterator.next()) {
            stats.hospitals++;
        }
        await iterator.close();
    
        // RECORDS
        iterator = await ctx.stub.getStateByPartialCompositeKey('record', []);
        for (let it = await iterator.next(); !it.done; it = await iterator.next()) {
            stats.records++;
        }
        await iterator.close();
    
        return JSON.stringify(stats);
    }
    
    
    
    
    async getPatientsForDoctor(ctx) {
        const doctorId = ctx.clientIdentity.getAttributeValue('uuid');
        const accessIterator = await ctx.stub.getStateByPartialCompositeKey('access', []);
        const patients = [];
    
        let res = await accessIterator.next();
        while (!res.done) {
            if (res.value && res.value.key) {
                const keyParts = ctx.stub.splitCompositeKey(res.value.key);
                const [patientId, docId] = keyParts.attributes;
    
                // Only return patients that THIS doctor has access to
                if (docId === doctorId) {
    
                    // Fetch patient info using PAT- prefix
                    const patientKey = `PAT-${patientId}`;
                    const patientData = await ctx.stub.getState(patientKey);
    
                    if (patientData && patientData.length > 0) {
                        const patient = JSON.parse(patientData.toString());
    
                        // Fetch all records for this patient
                        const recordIterator = await ctx.stub.getStateByPartialCompositeKey('record', [patientId]);
                        const records = [];
    
                        let recRes = await recordIterator.next();
                        while (!recRes.done) {
                            if (recRes.value && recRes.value.value) {
                                const record = JSON.parse(recRes.value.value.toString('utf8'));
    
                                // Only include records created by this doctor
                                if (record.doctorId === doctorId) {
                                    records.push({
                                        recordId: record.recordId,
                                        diagnosis: record.diagnosis,
                                        prescription: record.prescription,
                                        reportHash: record.reportHash,
                                        timestamp: record.timestamp
                                    });
                                }
                            }
                            recRes = await recordIterator.next();
                        }
    
                        await recordIterator.close();
    
                        // Add patient + their related records
                        patients.push({
                            patientId: patient.patientId,
                            name: patient.name,
                            dob: patient.dob,
                            city: patient.city,
                            records: records
                        });
                    }
                }
            }
            res = await accessIterator.next();
        }
    
        await accessIterator.close();
        return JSON.stringify(patients);
    }
    
    
    /**
 * Doctor requests access to a patient's records.
 * args: JSON string { patientId, doctorId, hospitalId, reason }
 * - role: must be 'doctor' (from cert attribute)
 */
async requestAccess(ctx, args) {
    const { patientId, doctorId, hospitalId, reason } = JSON.parse(args);
    const { role, uuid: callerId } = this.getCallerAttributes(ctx);
  
    if (role !== 'doctor') {
      throw new Error('Only doctors can request access');
    }
    // callerId must match doctorId in cert (optional but recommended)
    if (callerId !== doctorId) {
      throw new Error('Doctor certificate does not match doctorId');
    }
  
    // prevent duplicate pending request from same doctor (optional)
    // we'll still allow historical requests, but check for pending ones:
    const existingIt = await ctx.stub.getStateByPartialCompositeKey('accessRequest', [patientId, doctorId]);
    let existing = await existingIt.next();
    while (!existing.done) {
      if (existing.value && existing.value.value) {
        const obj = JSON.parse(existing.value.value.toString('utf8'));
        if (obj.status === 'pending') {
          throw new Error('A pending request from this doctor already exists');
        }
      }
      existing = await existingIt.next();
    }
    await existingIt.close();
  
    const txId = ctx.stub.getTxID();
    const requestKey = ctx.stub.createCompositeKey('accessRequest', [patientId, doctorId, txId]);
  
    const requestObj = {
      requestId: txId,
      patientId,
      doctorId,
      hospitalId,
      reason: reason || '',
      requester: callerId,
      status: 'pending',     // pending | approved | rejected
      createdAt: new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString()
    };
  
    await ctx.stub.putState(requestKey, Buffer.from(JSON.stringify(requestObj)));
    return JSON.stringify({ message: 'Access request submitted', request: requestObj });
  }
  
  /**
   * Patient lists pending/handled requests.
   * args: JSON string { patientId }
   * Note: we use patientId from args so admin/hospital UIs can also list requests (but you may restrict)
   */
  async getAccessRequests(ctx, args) {
    const { patientId } = JSON.parse(args);
    const iterator = await ctx.stub.getStateByPartialCompositeKey('accessRequest', [patientId]);
    const results = [];
  
    let res = await iterator.next();
    while (!res.done) {
      if (res.value && res.value.value) {
        try {
          results.push(JSON.parse(res.value.value.toString('utf8')));
        } catch (e) {
          // skip parse error
        }
      }
      res = await iterator.next();
    }
    await iterator.close();
    return JSON.stringify(results);
  }
  
  /**
   * Patient approves or rejects a specific request.
   * args: JSON string { patientId, doctorId, requestId, action } where action = "approved"|"rejected"
   *
   * On approve -> create 'access' composite key and update patient's authorizedDoctors (maintain same logic as grantAccess)
   */
  async updateAccessRequest(ctx, args) {
    const { patientId, doctorId, requestId, action } = JSON.parse(args);
    const { role, uuid: callerId } = this.getCallerAttributes(ctx);
  
    if (role !== 'patient') throw new Error('Only patients can update requests');
    if (callerId !== patientId) throw new Error('Caller is not the patient owner');
  
    if (!['approved', 'rejected'].includes(action)) throw new Error('Invalid action');
  
    // find request (composite key includes requestId as third attribute)
    const requestKey = ctx.stub.createCompositeKey('accessRequest', [patientId, doctorId, requestId]);
    const requestBytes = await ctx.stub.getState(requestKey);
    if (!requestBytes || requestBytes.length === 0) throw new Error('Request not found');
  
    const requestObj = JSON.parse(requestBytes.toString('utf8'));
    if (requestObj.status !== 'pending') {
      throw new Error('Request already handled');
    }
  
    requestObj.status = action;
    requestObj.handledAt = new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString();
    requestObj.handledBy = callerId;
  
    await ctx.stub.putState(requestKey, Buffer.from(JSON.stringify(requestObj)));
  
    if (action === 'approved') {
      // create access composite key (same pattern as your grantAccess)
      const accessKey = ctx.stub.createCompositeKey('access', [patientId, doctorId]);
      const accessData = {
        doctorId,
        hospitalId: requestObj.hospitalId || null,
        grantedAt: new Date(ctx.stub.getTxTimestamp().seconds.low * 1000).toISOString(),
        grantedByRequestId: requestId
      };
  
      await ctx.stub.putState(accessKey, Buffer.from(JSON.stringify(accessData)));
  
      // add to patient's authorizedDoctors array if not present
      const patientKey = `PAT-${patientId}`;
      const patientBytes = await ctx.stub.getState(patientKey);
      if (!patientBytes || patientBytes.length === 0) throw new Error('Patient not found');
  
      const patient = JSON.parse(patientBytes.toString('utf8'));
      if (!Array.isArray(patient.authorizedDoctors)) patient.authorizedDoctors = [];
      if (!patient.authorizedDoctors.includes(doctorId)) {
        patient.authorizedDoctors.push(doctorId);
        await ctx.stub.putState(patientKey, Buffer.from(JSON.stringify(patient)));
      }
    }
  
    return JSON.stringify({ message: `Request ${action}` , request: requestObj });
  }

  async getAllPatients(ctx) {
    const startKey = "PAT-";
    const endKey = "PAT-~";

    const iterator = await ctx.stub.getStateByRange(startKey, endKey);
    const patients = [];

    let result = await iterator.next();
    while (!result.done) {
        if (result.value && result.value.value) {
            try {
                const patient = JSON.parse(result.value.value.toString());
                patients.push({
                    patientId: patient.patientId,
                    name: patient.name,
                    dob: patient.dob,
                    city: patient.city,
                    age: patient.age,
                    bloodGroup: patient.bloodGroup
                });
            } catch (e) {}
        }
        result = await iterator.next();
    }

    await iterator.close();
    return JSON.stringify(patients);
}


async checkDoctorAccess(ctx, doctorId, patientId) {
    const patientBytes = await ctx.stub.getState(patientId);
    if (!patientBytes || !patientBytes.length) return false;

    const patient = JSON.parse(patientBytes.toString());

    if (!patient.accessList) return false;

    return patient.accessList.includes(doctorId);   // true / false
}

    

    // get patient details by id

    // get all patient 

    // get patient record by doctor

    // issue insurance 

    // create claim 

    // get claim info

    // approve claim

    // onboard Researchers 
    
    // send consent request to patient

    // get patient data for Researchers 

    // issue reward to patient 
    
    // claim reward - by patient

}

module.exports = ehrChainCode;