"use strict";

const { Contract } = require("fabric-contract-api");
const Request = require("./request");

class BloodTransferContract extends Contract {
    constructor(){
        super("BloodTransferContract");
    }

    async requestBlood(ctx, id, description, requestedTo, isPublic, type, quantity){
        const exists = await this.requestExists(ctx, id);
        if (exists){
            throw new Error(`Transaction ${id} already exists`);
        }

        const clientId = await this.getClientId(ctx);
        const request = new Request(id, description, clientId, requestedTo, isPublic, type, quantity);

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(request)));
    }

    async requestExists(ctx, id){
        const requestBuffer = await ctx.stub.getState(id);
        return (requestBuffer && requestBuffer.length>0);
    }

    async getRequest(ctx, id){
        const requestBuffer = await ctx.stub.getState(id);
        
        if (!requestBuffer || requestBuffer.length===0) {
            throw new Error(`Requested Transaction ${id} does not exist`);
        }
        
        const clientId = await this.getClientId(ctx);
        const request = JSON.parse(requestBuffer.toString());

        if (request.requestedBy!==clientId && request.requestedTo!==clientId && !request.isPublic){
            return false;
        }

        return request;
    }

    async grantBlood(ctx, id){
        const exists = await this.requestExists(ctx, id);

        if (!exists){
            throw new Error(`Transaction ${id} does not exist`);
        }

        const request = await this.getRequest(ctx, id);
        
        if (!request || request.isGranted || request.isShut || request.isDeclined){
            throw new Error(`Unauthorized action on transaction ${id}`);
        }
        
        const clientId = await this.getClientId(ctx);
        request.isGranted = true;
        request.grantedBy = clientId;
  
        await ctx.stub.putState(id, Buffer.from(JSON.stringify(request)));
    }

    async getClientId(ctx) {
        return `${ctx.clientIdentity.getMSPID()}:${ctx.clientIdentity.getID()}`;
    }

    async shutRequest(ctx, id){
        const exists = await this.requestExists(ctx, id);
        
        if (!exists){
            throw new Error(`Transaction ${id} already expired`);
        }
        
        const clientId = await this.getClientId(ctx);
        const request = await this.getRequest(ctx, id);

        if (!request || request.requestedBy!==clientId){
            throw new Error(`Unauthorized action on transaction ${id}`);
        }

        request.isShut = true;

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(request)));
    }

    async declineRequest(ctx, id){
        const exists = await this.requestExists(ctx, id);
        
        if (!exists){
            throw new Error(`Transaction ${id} has expired`);
        }
        
        const clientId = await this.getClientId(ctx);
        const request = await this.getRequest(ctx, id);

        if (!request || request.requestedTo!==clientId){
            throw new Error(`Unauthorized action on transaction ${id}`);
        }

        request.isDeclined = true;

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(request)));
    }

    async getRequestsRequestedBy(ctx){
        const clientId = await this.getClientId(ctx);

        const query = {
            selector: {
                requestedBy: clientId
            }
        };
        const open = [];
        const closed = [];
        const declined = [];
        const granted = [];

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        let result = await iterator.next();

        while (!result.done){
            const requestBuffer = Buffer.from(result.value.value.toString()).toString("utf8");
            let request;
            try {
                request = JSON.parse(requestBuffer);
            } catch (err) {
                console.log(err);
                request = requestBuffer;
            }
                
            if (request.isShut){
                closed.push(request);
            }
            else if (request.isDeclined){
                declined.push(request);
            }
            else if (request.isGranted){
                granted.push(request);
            }
            else {
                open.push(request);
            }

            result = await iterator.next();
        }

        return { open, closed, declined, granted };
    }

    async getRequestsRequestedTo(ctx){
        const clientId = await this.getClientId(ctx);

        const query = {
            selector: {
                requestedTo: clientId
            }
        };
        const open = [];
        const declined = [];
        const granted = [];

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        let result = await iterator.next();
        
        while (!result.done){
            const requestBuffer = Buffer.from(result.value.value.toString()).toString("utf8");
            let request;
            try {
                request = JSON.parse(requestBuffer);
            } catch (err) {
                console.log(err);
                request = requestBuffer;
            }

            if (request.isDeclined){
                declined.push(request);
            }
            else if (request.isGranted){
                granted.push(request);
            }
            else if (!request.isShut){
                open.push(request);
            }

            result = await iterator.next();
        }

        return { open, declined, granted };
    }

    async getRequestsIsPublic(ctx){
        const open = [];

        const iterator = await ctx.stub.getStateByRange("", "");
        let result = await iterator.next();

        while (!result.done){
            const requestBuffer = Buffer.from(result.value.value.toString()).toString("utf8");
            let request;
            try {
                request = JSON.parse(requestBuffer);
            } catch (err) {
                console.log(err);
                request = requestBuffer;
            }

            // if (request.isPublic && !request.isShut && !request.isGranted){
                open.push(request);
            // }

            result = await iterator.next();
        }

        return { open };
    }
}

module.exports = BloodTransferContract;