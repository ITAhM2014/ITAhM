package com.itahm.json;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import com.itahm.json.RollingFile.TYPE;

public class RollingMap {
	
	public static enum Resource {
		HRPROCESSORLOAD("hrProcessorLoad"),
		IFINOCTETS("ifInOctets"),
		IFOUTOCTETS("ifOutOctets"),
		HRSTORAGEUSED("hrStorageUsed");
		
		private String string;
		
		private Resource(String arg) {
			string = arg;
		}
		
		public String toString() {
			return this.string;
		}
	}
	
	private final Map<Resource, HashMap<String, RollingFile>> map;
	
	private final File root;
	
	public RollingMap(File nodeRoot) {
		root = nodeRoot;
		map = new HashMap<Resource, HashMap<String, RollingFile>>();
		
		for (Resource resource : Resource.values()) {
			map.put(resource, new HashMap<String, RollingFile>());
			
			new File(root, resource.toString()).mkdir();
		}
	}

	public void put(Resource resource, String index, long value) throws IOException {
		Map<String, RollingFile> map = this.map.get(resource);
		RollingFile rollingFile = map.get(index);
		
		if (rollingFile == null) {
			TYPE type;
			
			switch(resource) {
			case IFINOCTETS:
			case IFOUTOCTETS:
				type = TYPE.COUNTER;
				break;
			
			default:
				type = TYPE.GAUGE;
			}
			
			map.put(index, rollingFile = new RollingFile(new File(this.root, resource.toString()), index, type));
		}
		
		rollingFile.roll(value);
	}
}
