'use strict'
const { Contract } = require('fabric-contract-api');
const sortKeysRecursive = require('sort-keys-recursive');
const stringify = require('json-stable-stringify');

class ehrChaincode extends Contract {
    //1.Government - Admin
    //2.Hospital
    //3.Patient
    //4.Doctor
    //5.Lab
    //6.Pharmacy
    //7. Insurance
    //8. Researcher
    
    recordIdGenerator(ctx) {
        const txId=ctx.stub.getTxID();
        return `record-${txId}`;
    }

    async onboardDoctor(ctx, doctorId,hostpitalName,name,city){
        const {role,uuid:callerId}=this.getCallerAttributes(ctx);
        const orgMSP = ctx.clientIdentity.getMSPID();

        if (role !== 'hospital' || orgMSP !== 'Org1MSP') {
            throw new Error('Only hospital can onboard a doctor');
        }
        const doctorJSON = await ctx.stub.getState(doctorId);
        if(doctorJSON ||doctorJSON.length !== 0){
            throw new Error(`Doctor with ID ${doctorId} already exists`);
        }

        const recordId = this.recordIdGenerator(ctx);
        console.log(`Generated record ID: ${recordId}`);

        const record={
            recordId,
            doctorId,
            hostpitalName,
            name,
            city,
            hospitalId: callerId,
            timestamp: new Date().toISOString(),
        };

        await ctx.stub.putState(recordId, Buffer.from(stringify(sortKeysRecursive(record))));
        console.log(`Doctor ${doctorId} onboarded successfully with record ID: ${recordId}`);
        return JSON.stringify(record); 
    }

    async onboardInsurance(ctx, agentId,insuranceName,name,city){
        const {role,uuid:callerId}=this.getCallerAttributes(ctx);
        const orgMSP = ctx.clientIdentity.getMSPID();

        if (role !== 'insuranceAdmin' || orgMSP !== 'Org2MSP') {
            throw new Error('Only insurance org admin can onboard an agent');
        }
        
        const agentJSON = await ctx.stub.getState(agentId);
        if(agentJSON ||agentJSON.length !== 0){
            throw new Error(`Insurance agent with ID ${agentId} already exists`);
        }
        const recordId = this.recordIdGenerator(ctx);
        console.log(`Generated record ID: ${recordId}`);

        const record = {
            recordId,
            agentId,
            insuranceCompany: insuranceName,
            name,
            city,
            insuranceId: callerId,
            timestamp: new Date().toISOString(),
        };
        await ctx.stub.putState(agentId, Buffer.from(stringify(sortKeysRecursive(record))));
        console.log(`Insurance agent ${agentId} onboarded successfully with record ID: ${recordId}`);
        return JSON.stringify(record);
    }

    async grantAccess(ctx,patientId, doctorIdToGrant){
        const {role,uuid:callerId}=this.getCallerAttributes(ctx);

        if (role !== 'patient' || callerId !== patientId) {
            throw new Error('Only the patient can grant access to their records');
        }

        const patientJSON = await ctx.stub.getState(patientId);
        if (!patientJSON || patientJSON.length === 0) {
            throw new Error(`Patient with ID ${patientId} does not exist`);
        }
        const patientRecord = JSON.parse(patientJSON.toString());

        if(patientRecord.authorizedDoctors.includes(doctorIdToGrant)){
            throw new Error(`Doctor with ID ${doctorIdToGrant} already has access to patient ${patientId}'s records`);
        }

        patientRecord.authorizedDoctors.push(doctorIdToGrant);
        await ctx.stub.putState(patientId, Buffer.from(stringify(sortKeysRecursive(patientRecord))));

        return `Access granted to doctor ${doctorIdToGrant} for patient ${patientId}'s records`;
    }

    getCallerAttributes(ctx) {
        const attributes = ctx.clientIdentity.getAttributeValue('role');
        if (!attributes) {
            throw new Error('Caller does not have a role attribute');
        }
        const uuid = ctx.clientIdentity.getAttributeValue('uuid');
        if (!uuid) {
            throw new Error('Caller does not have a uuid attribute');
        }
        return { role: attributes, uuid };
    }

    async addRecord(ctx, recordId,patientId, doctorId,diagnosis,prescription) {
        const {role,uuid:callerId}=this.getCallerAttributes(ctx);
        
        if (role !== 'doctor') {
            throw new Error('Only the doctor can add a record');
        }
        const patientJSON = await ctx.stub.getState(patientId);
        if (!patientJSON || patientJSON.length === 0) {
            throw new Error(`Patient with ID ${patientId} does not exist`);
        }
        const patientRecord = JSON.parse(patientJSON.toString());
        if (!patientRecord.authorizedDoctors || !patientRecord.authorizedDoctors.includes(callerId)) {
            throw new Error(`Doctor ${callerId} is not authorized to add records for patient ${patientId}`);
        }
        const record = {
            recordId,
            doctorId:callerId,
            diagnosis,
            prescription,
            timestamp: new Date().toISOString(),
        };
        //patientRecord.records = patientRecord.records || [];
        patientRecord.records.push(record);
        await ctx.stub.putState(patientId, Buffer.from(stringify(sortKeysRecursive(patientRecord))));
        console.log(`Record ${recordId} added for patient ${patientId} by doctor ${callerId}`);
    }

    async getAllRecords(ctx) {
        //call by admin
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString('utf8'));
            let record;
            try {
                record = JSON.parse(strValue);
            }catch (err) {
                console.log(`Error parsing JSON: ${err}`);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    async getClaimInfo(ctx, patientId){
        const {role,uuid:callerId}=this.getCallerAttributes(ctx);
        
        const orgMSP = ctx.clientIdentity.getMSPID();
        if (orgMSP !== 'Org2MSP' || role !== 'insurer') {
            throw new Error('Only insurance org can access claim information');
        }
        const patientJSON = await ctx.stub.getState(patientId);
        if (!patientJSON || patientJSON.length === 0) {
            throw new Error(`Patient with ID ${patientId} does not exist`);
        }
        const patientRecord = JSON.parse(patientJSON.toString());
        if(!patientRecord.authorizedInsurance.includes(callerId)){
            throw new Error(`Insurance ${uuid} is not authorized to access patient ${patientId}'s claim information`);
        }

        return JSON.stringify({
            patientId: patientRecord.patientId,
            records:patientRecord.records.map(record => ({
                recordId: record.recordId,
                diagnosis: record.diagnosis,
                costEstimate: record.costEstimate || 0,
                timestamp: record.timestamp,
            })),
        });
    }
    
}