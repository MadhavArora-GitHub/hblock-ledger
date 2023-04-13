"use strict";

class Request {
    constructor(id, description, requestedBy, requestedTo, isPublic, type, quantity) {
        this.id = id;
        this.description = description;
        this.requestedBy = requestedBy;
        this.requestedTo = requestedTo;
        this.isGranted = false;
        this.grantedBy = "";
        this.type = type;
        this.quantity = quantity;
        this.isPublic = isPublic;
        this.isShut = false;
        this.isDeclined = false;
    }
}

module.exports = Request;


  