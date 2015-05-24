package com.itahm.snmp;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import com.itahm.json.RollingFile;

public class IndexMap {

	private final File root;
	private final Map<String, RollingFile> map;
	
	public IndexMap(File indexRoot) {
		root = indexRoot;
		
		map = new HashMap<String, RollingFile>();
	}

	public void put(String index, long value) throws IOException {
		RollingFile file = map.get(index);
		
		if (file == null) {
			file = map.put(index, new RollingFile(root, index));
		}
		
		file.roll(index, value);
	}
}
