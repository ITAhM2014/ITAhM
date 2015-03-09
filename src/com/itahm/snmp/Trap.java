package com.itahm.snmp;

import java.io.IOException;
import java.util.Vector;

import org.snmp4j.CommunityTarget;
import org.snmp4j.PDU;
import org.snmp4j.Snmp;
import org.snmp4j.mp.SnmpConstants;
import org.snmp4j.smi.OID;
import org.snmp4j.smi.OctetString;
import org.snmp4j.smi.UdpAddress;
import org.snmp4j.smi.VariableBinding;
import org.snmp4j.transport.DefaultUdpTransportMapping;

public class Trap {

	public Trap() throws IOException {
		CommunityTarget target = new CommunityTarget();
		
		target.setCommunity(new OctetString("public"));
		target.setAddress(new UdpAddress("192.168.0.100/162"));
		target.setVersion(SnmpConstants.version2c);
		target.setRetries(0);
		target.setTimeout(1000);
		
		Snmp snmp = new Snmp(new DefaultUdpTransportMapping());
		
		PDU pdu = new PDU();
		
		pdu.add(new VariableBinding(new OID(Constants.snmpTrapOID).append(0), Constants.linkDown));
		
		snmp.notify(pdu, target);
	}

	public static void main(String [] args) throws IOException {
		String s = (String)null;
		
		System.out.print(s);
	}
}
