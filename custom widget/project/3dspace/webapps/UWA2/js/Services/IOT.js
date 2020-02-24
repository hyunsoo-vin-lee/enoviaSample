/*!
  Script: IOT.js

    This file is part of UWA JS Runtime.

  About: License

    Copyright 2006-2014 Netvibes, a Dassault Systèmes company.
    All rights reserved.

*/
define("UWA/Services/IOT",["UWA/Core"],function(c){var b=function(){};var a={registerEventSender:function(d){if(!c.is(d,"function")){throw new Error("Event sender must be a function")}b=d},sendEvent:function(d){b.call(null,d)}};return c.namespace("Services/IOT",a,c)});