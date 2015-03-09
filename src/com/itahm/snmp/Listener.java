package com.itahm.snmp;

import java.util.Vector;

import org.snmp4j.PDU;
import org.snmp4j.Snmp;
import org.snmp4j.event.ResponseEvent;
import org.snmp4j.event.ResponseListener;
import org.snmp4j.smi.Counter64;
import org.snmp4j.smi.Gauge32;
import org.snmp4j.smi.Integer32;
import org.snmp4j.smi.OID;
import org.snmp4j.smi.OctetString;
import org.snmp4j.smi.Variable;
import org.snmp4j.smi.VariableBinding;

public class Listener implements ResponseListener {
	
	private final Service service;
	
	public Listener(Service service) {
		this.service = service;
	}
	
	private void onResponse(PDU request, PDU response, Device device) throws Exception {
		Vector<? extends VariableBinding> requestVBs = request.getVariableBindings();
		Vector<? extends VariableBinding> responseVBs = response.getVariableBindings();
		Vector<VariableBinding> vbs = new Vector<VariableBinding>();
		VariableBinding requestVB;
		VariableBinding responseVB;
		OID requestOID;
		OID responseOID;
		int requestSize;
		int responseSize;
		
		for (int i=0, length = responseVBs.size(); i<length; i++) {
			requestVB = (VariableBinding)requestVBs.get(i);
			responseVB = (VariableBinding)responseVBs.get(i);
			
			parse(responseVB.getOid(), responseVB.getVariable(), device);
			
			requestOID = requestVB.getOid();
			responseOID = responseVB.getOid();
			requestSize = requestOID.size();
			responseSize = responseOID.size();
			
			if (responseOID.leftMostCompare(requestSize == responseSize? requestSize -1: requestSize, requestOID) == 0) {
				vbs.add(responseVB);
			}
		}
		
		if (vbs.size() > 0) {
			request.setVariableBindings(vbs);
			
			this.service.send(device, request);
		}
	}
	
	@Override
	public void onResponse(ResponseEvent event) {
		PDU request = event.getRequest();
		PDU response = event.getResponse();

		((Snmp)event.getSource()).cancel(request, this);
		
		if (response == null) {
			// todo: time out process
			
			return;
		}
		
		int status = response.getErrorStatus();
		
		if (status == PDU.noError) {
			try {
				onResponse(request, response, (Device)event.getUserObject());
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		else {
			// todo: error status process
			System.out.println(String.format("error status : %s", response.getErrorStatusText()));
			System.out.println(String.format("error index : %d", response.getErrorIndex()));
		}
	}
	
	private final void parse (OID oid, Variable variable/*, Address address*/, Device device) {		
		if (oid.leftMostCompare(5, Constants.mgmt) == 0) {
			if (oid.leftMostCompare(6, Constants.mib_2) == 0) {
				if (oid.leftMostCompare(7, Constants.system) == 0) {
					if (oid.leftMostCompare(8, Constants.sysDescr) == 0) {
						OctetString value = (OctetString)variable;
					
						device.update(Constants.sysDescr, new String(value.getValue()));
					}
					else if (oid.leftMostCompare(8, Constants.sysObjectID) == 0) {
						OID value = (OID)variable;
						
						device.update(Constants.sysObjectID, value.toDottedString());
					}
					else if (oid.leftMostCompare(8, Constants.sysName) == 0) {
						OctetString value = (OctetString)variable;
						
						device.update(Constants.sysName, new String(value.getValue()));
					}
				}
				else if (oid.leftMostCompare(7, Constants.interfaces) == 0) {
					if (oid.leftMostCompare(8,Constants. ifNumber) == 0) {
						Integer32 value = (Integer32)variable;
						
						value.getValue();
					}
					else if (oid.leftMostCompare(8, Constants.ifTable) == 0) {
						if (oid.leftMostCompare(9, Constants.ifEntry) == 0) {
							if (oid.leftMostCompare(10, Constants.ifIndex) == 0) {
								Integer32 value = (Integer32)variable;
								
								device.update(oid.last(), Constants.ifIndex, value.getValue());
							}
							else if (oid.leftMostCompare(10, Constants.ifDescr) == 0) {
								OctetString value = (OctetString)variable;
								
								device.update(oid.last(), Constants.ifDescr, new String(value.getValue()));
							}
							else if (oid.leftMostCompare(10, Constants.ifType) == 0) {
								Integer32 value = (Integer32)variable;
								
								device.update(oid.last(), Constants.ifType, value.getValue());
							}
							else if (oid.leftMostCompare(10, Constants.ifSpeed) == 0) {
								Gauge32 value = (Gauge32)variable;
								
								device.update(oid.last(), Constants.ifSpeed, value.getValue());
							}
							else if (oid.leftMostCompare(10, Constants.ifPhysAddress) == 0) {
								OctetString value = (OctetString)variable;
								
								device.update(oid.last(), Constants.ifPhysAddress, new String(value.getValue()));
							}
							else if (oid.leftMostCompare(10, Constants.ifAdminStatus) == 0) {
								Integer32 value = (Integer32)variable;
								
								device.update(oid.last(), Constants.ifAdminStatus, value.getValue());
							}
							else if (oid.leftMostCompare(10, Constants.ifOperStatus) == 0) {
								Integer32 value = (Integer32)variable;
								
								device.update(oid.last(), Constants.ifOperStatus, value.getValue());
							}
						}
					}
				}
				else if (oid.leftMostCompare(7, Constants.at) == 0) {
					if (oid.leftMostCompare(8, Constants.atTable) == 0) {
						if (oid.leftMostCompare(9, Constants.atEntry) == 0) {
							if (oid.leftMostCompare(10, Constants.atPhysAddress) == 0) {
								
							}
							else if (oid.leftMostCompare(10, Constants.atNetAddress) == 0) {
								
							}
						}
					}
				}
				else if (oid.leftMostCompare(7, Constants.ifMib) == 0) {
					//if (oid.leftMostCompare(8, Constants.ifMibObjects) == 0) 
						//if (oid.leftMostCompare(9, Constants.ifXTable) == 0) 
							if (oid.leftMostCompare(10, Constants.ifXEntry) == 0) {
								if (oid.leftMostCompare(11, Constants.ifName) == 0) {
									OctetString value = (OctetString)variable;
									
									device.update(Constants.ifName, new String(value.getValue()));
								}
								else if (oid.leftMostCompare(11, Constants.ifHCInOctets) == 0) {
									Counter64 value = (Counter64)variable;
									
									device.update(oid.last(), Constants.ifHCInOctets, value.getValue());
								}
								else if (oid.leftMostCompare(11, Constants.ifHCOutOctets) == 0) {
									Counter64 value = (Counter64)variable;
									
									device.update(oid.last(), Constants.ifHCOutOctets, value.getValue());
								}
								else if (oid.leftMostCompare(11, Constants.ifAlias) == 0) {
									OctetString value = (OctetString)variable;
									
									device.update(Constants.ifAlias, new String(value.getValue()));
								}
							}
				}
				else {
					//
				}
			}
		}
	}

}
