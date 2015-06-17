package com.itahm.snmp;

import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

import com.itahm.json.RollingFile;
import com.itahm.json.RollingFile.TYPE;

public class IndexMap {

	private final File root;
	private final TYPE type;
	private final Map<String, RollingFile> map;
	
	public IndexMap(File indexRoot, TYPE rsctype) {
		root = indexRoot;
		type = rsctype;
		root.mkdir();
		
		map = new HashMap<String, RollingFile>();
	}

	public void put(String index, long value) throws IOException {
		RollingFile file = map.get(index);
		
		if (file == null) {
			map.put(index, file = new RollingFile(root, index, this.type));
		}
		
		file.roll(value);
	}
}
