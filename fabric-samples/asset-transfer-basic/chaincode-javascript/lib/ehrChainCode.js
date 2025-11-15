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
    
        const hospital = { hospitalId, name, city, departments, timestamp: ctx.stub.getTxTimestamp().seconds.low.toString() };
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
    

    async onboardPatient(ctx, args) {
        const { patientId, name, dob, city } = JSON.parse(args);
        const key = `PAT-${patientId}`;
    
        const existing = await ctx.stub.getState(key);
        if (existing && existing.length > 0) {
            throw new Error(`Patient ${patientId} already exists`);
        }
    
        const patient = {
            patientId,
            name,
            dob,
            city,
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
    
    
    
    

    // GetAllAssets returns all assets found in the world state.
    async fetchLedger(ctx) {
        // call by admin only 
        const { role, uuid: callerId } = this.getCallerAttributes(ctx);

        if (role !== 'hospital') {
            throw new Error('Only hospital can fetch blockchain ledger');
        }

        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return stringify(allResults);
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
        const { name, dob, city } = JSON.parse(args);
    
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
        if (name) patient.name = name;
        if (dob) patient.dob = dob;
        if (city) patient.city = city;
    
        await ctx.stub.putState(userKey, Buffer.from(JSON.stringify(patient)));
    
        return JSON.stringify({ message: "Profile updated successfully" });
    }
    
    
    

    async revokeAccess(ctx, patientId, doctorId) {
        const accessKey = ctx.stub.createCompositeKey('access', [patientId, doctorId]);
        await ctx.stub.deleteState(accessKey);
        return JSON.stringify({ message: "Access revoked" });
    }

    async getAccessList(ctx, args) {
        const { patientId } = JSON.parse(args);
    
        const iterator = await ctx.stub.getStateByPartialCompositeKey('access', [patientId]);
        const result = [];
    
        let res = await iterator.next();
        while (!res.done) {
            const data = JSON.parse(res.value.value.toString());
            result.push({
                doctorId: data.doctorId,
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
    
        // PATIENTS
        let iterator = await ctx.stub.getStateByRange('Patient-', 'Patient-~');
        for (let it = await iterator.next(); !it.done; it = await iterator.next()) {
            stats.patients++;
        }
        await iterator.close();
    
        // DOCTORS (Corrected)
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