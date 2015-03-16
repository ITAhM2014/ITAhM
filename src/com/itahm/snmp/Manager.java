package com.itahm.snmp;

import java.io.Closeable;
import java.io.IOException;
import java.net.UnknownHostException;
import java.util.Iterator;
import java.util.Vector;

import org.snmp4j.PDU;
import org.snmp4j.Snmp;
import org.snmp4j.event.ResponseEvent;
import org.snmp4j.event.ResponseListener;
import org.snmp4j.smi.Counter32;
import org.snmp4j.smi.Counter64;
import org.snmp4j.smi.Gauge32;
import org.snmp4j.smi.Integer32;
import org.snmp4j.smi.Null;
import org.snmp4j.smi.OID;
import org.snmp4j.smi.OctetString;
import org.snmp4j.smi.Variable;
import org.snmp4j.smi.VariableBinding;
import org.snmp4j.transport.DefaultUdpTransportMapping;

public class Manager implements Closeable, ResponseListener  {

	private final Snmp snmp;
	private Worker worker;
	
	private final static PDU pdu = new PDU();
	static {
		pdu.setType(PDU.GETNEXT);
		// iso.org.dod.internet.mgmt.mib_2.system
		pdu.add(new VariableBinding(Constants.sysDescr));
		pdu.add(new VariableBinding(Constants.sysObjectID));
		pdu.add(new VariableBinding(Constants.sysName));
		//pdu.add(new VariableBinding(Constants.ifIndex));
		pdu.add(new VariableBinding(Constants.ifDescr));
		pdu.add(new VariableBinding(Constants.ifType));
		pdu.add(new VariableBinding(Constants.ifSpeed));
		pdu.add(new VariableBinding(Constants.ifPhysAddress));
		pdu.add(new VariableBinding(Constants.ifAdminStatus));
		pdu.add(new VariableBinding(Constants.ifOperStatus));
		pdu.add(new VariableBinding(Constants.ifName));
		pdu.add(new VariableBinding(Constants.ifInOctets));
		pdu.add(new VariableBinding(Constants.ifOutOctets));
		pdu.add(new VariableBinding(Constants.ifHCInOctets));
		pdu.add(new VariableBinding(Constants.ifHCOutOctets));
		pdu.add(new VariableBinding(Constants.ifAlias));
	}
	
	public Manager() throws IOException {
		snmp = new Snmp(new DefaultUdpTransportMapping());
		
		snmp.listen();
	}

	public void setWorker(Worker worker) {
		this.worker = worker;
	}
	
	public void request(Node node) throws IOException {
		this.snmp.send(pdu, node, node, this);
	}
	
	private final void parse (Node node, OID oid, Variable variable) {
		if (oid.leftMostCompare(5, Constants.mgmt) == 0) {
			if (oid.leftMostCompare(6, Constants.mib_2) == 0) {
				if (oid.leftMostCompare(7, Constants.system) == 0) {
					if (oid.leftMostCompare(8, Constants.sysDescr) == 0) {
						OctetString value = (OctetString)variable;
					
						node.set(oid, new String(value.getValue()));
					}
					else if (oid.leftMostCompare(8, Constants.sysObjectID) == 0) {
						OID value = (OID)variable;
						
						node.set(oid, value.toDottedString());
					}
					else if (oid.leftMostCompare(8, Constants.sysName) == 0) {
						OctetString value = (OctetString)variable;
						
						node.set(oid, new String(value.getValue()));
					}
				}
				else if (oid.leftMostCompare(7, Constants.interfaces) == 0) {
					if (oid.leftMostCompare(9, Constants.ifEntry) == 0) {
						if (oid.leftMostCompare(10, Constants.ifIndex) == 0) {
							Integer32 value = (Integer32)variable;
							
							node.set(oid, value.getValue());
						}
						else if (oid.leftMostCompare(10, Constants.ifDescr) == 0) {
							OctetString value = (OctetString)variable;
							
							node.set(oid, new String(value.getValue()));
						}
						else if (oid.leftMostCompare(10, Constants.ifType) == 0) {
							Integer32 value = (Integer32)variable;
							
							node.set(oid, value.getValue());
						}
						else if (oid.leftMostCompare(10, Constants.ifSpeed) == 0) {
							Gauge32 value = (Gauge32)variable;
							
							node.set(oid, value.getValue());
						}
						else if (oid.leftMostCompare(10, Constants.ifPhysAddress) == 0) {
							OctetString value = (OctetString)variable;
							
							node.set(oid, new String(value.getValue()));
						}
						else if (oid.leftMostCompare(10, Constants.ifAdminStatus) == 0) {
							Integer32 value = (Integer32)variable;
							
							node.set(oid, value.getValue());
						}
						else if (oid.leftMostCompare(10, Constants.ifOperStatus) == 0) {
							Integer32 value = (Integer32)variable;
							
							node.set(oid, value.getValue());
						}
						else if (oid.leftMostCompare(10, Constants.ifInOctets) == 0) {
							Counter32 value = (Counter32)variable;
							
							node.set(oid, value.getValue());
						}
						else if (oid.leftMostCompare(10, Constants.ifOutOctets) == 0) {
							Counter32 value = (Counter32)variable;
							
							node.set(oid, value.getValue());
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
									
									node.set(oid, new String(value.getValue()));
								}
								else if (oid.leftMostCompare(11, Constants.ifHCInOctets) == 0) {
									Counter64 value = (Counter64)variable;
									
									node.set(oid, value.getValue());
								}
								else if (oid.leftMostCompare(11, Constants.ifHCOutOctets) == 0) {
									Counter64 value = (Counter64)variable;
									
									node.set(oid, value.getValue());
								}
								else if (oid.leftMostCompare(11, Constants.ifAlias) == 0) {
									OctetString value = (OctetString)variable;
									
									node.set(oid, new String(value.getValue()));
								}
							}
				}
				else {
					//
				}
			}
		}
	}
	
	private final PDU getNext(Node node, PDU request, PDU response) {
		Vector<? extends VariableBinding> requestVBs = request.getVariableBindings();
		Vector<? extends VariableBinding> vbs = response.getVariableBindings();
		Vector<VariableBinding> nextVBs = new Vector<VariableBinding>();
		VariableBinding requestVB, responseVB;
		OID requestOID, oid;
		Variable variable;
		int requestSize, size;
		
		for (int i=0, length = vbs.size(); i<length; i++) {
			requestVB = (VariableBinding)requestVBs.get(i);
			responseVB = (VariableBinding)vbs.get(i);
			
			requestOID = requestVB.getOid();
			oid = responseVB.getOid();
			variable = responseVB.getVariable();
			requestSize = requestOID.size();
			size = oid.size();
			
			if (!variable.equals(Null.endOfMibView) && oid.leftMostCompare(requestSize == size? requestSize -1: requestSize, requestOID) == 0) {
				parse(node, oid, variable);
				
				nextVBs.add(responseVB);
			}
		}
		
		return nextVBs.size() > 0? new PDU(PDU.GETNEXT, nextVBs): null;
	}
	
	private final void onResponse(Node node, PDU request, PDU response) throws IOException {
		if (response == null) {			
			if (this.worker != null) {
				this.worker.work(node, false, "response timed out");
			}
			
			return;
		}
		
		int status = response.getErrorStatus();
		
		if (status == PDU.noError) {
			try {
				
				PDU next = getNext(node, request, response);
				if (next == null) {
					if (this.worker != null) {
						this.worker.work(node, true, null);
					}
				}
				else {
					this.snmp.send(next, node, node, this);
				}
			} catch (Exception e) {
				e.printStackTrace();
			}
		}
		else {
			if (this.worker != null) {
				this.worker.work(node, false, String.format("error index[%d] status : %s", response.getErrorIndex(), response.getErrorStatusText()));
			}
		}
	}
	
	@Override
	public void close() throws IOException {
		this.snmp.close();
	}
	
	public static void main(String [] args) throws UnknownHostException, IOException {
		try (
			Manager manager = new Manager();
		) {
			manager.setWorker(new Worker() {
				public void work(Node node, boolean success, String msg) {
					if (success) {
						Iterator<OID> it = node.iterator();
						OID oid;
						while(it.hasNext()) {
							oid = it.next();
							
							System.out.println(oid.toDottedString() + " : "+ node.get(oid));
						}
					}
					else {
						System.out.println("request fail");
						if (msg != null) {
							System.out.println(msg);
						}
					}
				}
			});
			
			manager.request(new Node("192.168.0.20", 161, "itahm2014"));
			
			System.in.read();
		}
	}
	
	@Override
	public void onResponse(ResponseEvent event) {
		PDU request = event.getRequest();
		
		((Snmp)event.getSource()).cancel(request, this);
		
		try {
			onResponse((Node)event.getUserObject(), request, event.getResponse());
		} catch (IOException e) {
			// TODO fatal error
			e.printStackTrace();
		}
	}
	
}