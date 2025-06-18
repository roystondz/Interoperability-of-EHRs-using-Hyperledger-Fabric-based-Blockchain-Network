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
    //  {
    //     "patientId": "P001",
    //     "name": "John Doe",
    //     "dob": "1990-01-01",
    //     "records": [
    //         {
    //         "recordId": "R001",
    //         "doctorId": "D001",
    //         "diagnosis": "Flu",
    //         "prescription": "Rest and hydration",
    //         "timestamp": "2024-01-01T10:00:00Z"
    //         }
    //     ],
    //     "authorizedDoctors": ["D001", "D002"]
    //  }

    // generate recordId.
    recordIdGenerator(ctx){  
        const txId = ctx.stub.getTxID();  // always unique per transaction
         return `record-${txId}`; 
    }

    // onboard doctor in ledger by hospital 
    async onboardDoctor(ctx, doctorId, hospitalName, name, city){
        const { role, uuid: callerId } = this.getCallerAttributes(ctx);
        const orgMSP = ctx.clientIdentity.getMSPID();

        if (orgMSP !== 'Org1MSP' || role !== 'hospital') {
            throw new Error('Only hospital can onboard doctor.');
        }

        const doctorJSON = await ctx.stub.getState(doctorId);
        if (doctorJSON && doctorJSON.length > 0) {
            throw new Error(`Doctor ${doctorId} already registerd by ${callerId}`);
        }

        const recordId = this.recordIdGenerator(ctx);
        console.log("Record ID", recordId);
        
        const record = {
            recordId,
            doctorId,
            hospitalId: callerId,
            name,
            hospitalName,
            city,
           timestamp: ctx.stub.getTxTimestamp().seconds.low.toString()
        };

        const result = await ctx.stub.putState(doctorId, Buffer.from(stringify(record)));
        console.log('ONBOARD DOCTOR RESULT:',stringify(result))
        return stringify(record);
    }

      // onboard insurance agent by insurance company  
    async onboardInsurance(ctx, agentId, insuranceCompany, name, city){
        const { role, uuid: callerId } = this.getCallerAttributes(ctx);
         const orgMSP = ctx.clientIdentity.getMSPID();

        if (orgMSP !== 'Org2MSP' || role !== 'insuranceAdmin') {
            throw new Error('Only insurance org admin can onbord insurance agent');
        }
        
        const insuranceJSON = await ctx.stub.getState(agentId);
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
   async grantAccess(ctx, patientId, doctorIdToGrant) {
        
     const { role, uuid: callerId } = this.getCallerAttributes(ctx);

        if (role !== 'patient') {
            throw new Error('Only patients can grant access');
        }

        if (callerId !== patientId) {
            throw new Error('Caller is not the owner of this patient record');
        }

        const patientJSON = await ctx.stub.getState(patientId);
        if (!patientJSON || patientJSON.length === 0) {
            throw new Error(`Patient ${patientId} not found`);
        }

        const patient = JSON.parse(patientJSON.toString());

        if (patient.authorizedDoctors.includes(doctorIdToGrant)) {
            throw new Error(`Doctor ${doctorIdToGrant} already authorized`);
        }

        patient.authorizedDoctors.push(doctorIdToGrant);
        await ctx.stub.putState(patientId, Buffer.from(stringify(patient)));

        return `Access granted to doctor ${doctorIdToGrant}`;
    }

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
    async addRecord(ctx, patientId, recordId, diagnosis, prescription) {
        const { role, uuid: callerId } = this.getCallerAttributes(ctx);

        if (role !== 'doctor') {
            throw new Error('Only doctors can add records');
        }

        const patientJSON = await ctx.stub.getState(patientId);
        if (!patientJSON || patientJSON.length === 0) {
            throw new Error(`Patient ${patientId} not found`);
        }

        const patient = JSON.parse(patientJSON.toString());

        if (!patient.authorizedDoctors.includes(callerId)) {
            throw new Error(`Doctor ${callerId} is not authorized`);
        }

        const record = {
            recordId,
            doctorId: callerId,
            diagnosis,
            prescription,
           timestamp: ctx.stub.getTxTimestamp().seconds.low.toString()
        };

        patient.records.push(record);
        await ctx.stub.putState(patientId, Buffer.from(stringify(patient)));

        return `Record ${recordId} added by doctor ${callerId}`;
    }

    // GetAllAssets returns all assets found in the world state.
    async GetAllAssets(ctx) {
        // call by admin only 

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

module.exports.contracts = ehrChainCode;