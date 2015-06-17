package com.itahm.json;

import java.io.File;
import java.io.IOException;
import java.util.Calendar;

import org.json.JSONObject;

// TODO: Auto-generated Javadoc
/**
 * The Class RollingFile.
 */
public class RollingFile {

	/**
	 * 60s *1000mills
	 */
	private static final long MINUTE = 60000;
	
	/**
	 * 5m *60s *1000mills
	 */
	private static final long MINUTE5 = 300000;
	
	/**
	 * 1h * 60m *60s *1000mills
	 */
	public static final long HOUR = 3600000;
	
	/**
	 * 6h * 60m *60s *1000mills
	 */
	private static final long HOUR6 = 21600000;
	
	/**
	 * 24h * 60m *60s *1000mills
	 */
	public static final long DAY = 86400000;
	
	public static enum TYPE {
		GAUGE, COUNTER;
	}
	
	public static enum SCALE {
		MINUTE, MINUTE5, HOUR6
	}

	/** The last. */
	private int last = -1;
	
	private File root;
	
	private final JSONFile maxSummary;
	private final JSONFile minSummary;
	private final JSONFile avgSummary;
	private final  JSONObject maxData;
	private final  JSONObject minData;
	private final  JSONObject avgData;
	private JSONFile maxDailySummary;
	private JSONFile minDailySummary;
	private JSONFile avgDailySummary;
	private JSONObject maxDailyData;
	private JSONObject minDailyData;
	private JSONObject avgDailyData;
	private File dir;
	private JSONFile file;
	private JSONObject data;
	private final TYPE type;
	
	/**
	 * Instantiates a new rolling file.
	 *
	 * @param root the root (itahm\snmp\ip\resource)
	 * @param index the index of host, interfaces, etc.
	 * @param type gauge or counter
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	public RollingFile(File rscRoot, String index, TYPE type) throws IOException {
		root = new File(rscRoot, index);
		root.mkdir();
		
		maxSummary = new JSONFile(new File(root, "max"));
		maxData = maxSummary.getJSONObject();
		
		minSummary = new JSONFile(new File(root, "min"));
		minData = maxSummary.getJSONObject();
		
		avgSummary = new JSONFile(new File(root, "avg"));
		avgData = maxSummary.getJSONObject();
		
		this.type = type;
		
		Calendar calendar = Calendar.getInstance();
		
		calendar.set(Calendar.MILLISECOND, 0);
		calendar.set(Calendar.SECOND, 0);
		calendar.set(Calendar.MINUTE, 0);
		
		String fileName = Long.toString(calendar.getTimeInMillis());
		
		calendar.set(Calendar.HOUR_OF_DAY, 0);
		
		createDailyRolling(calendar.getTimeInMillis());
		
		createFile(fileName);
	}
	
	private void createFile(String fileName) {
		this.data = (this.file = new JSONFile(new File(this.dir, fileName))).getJSONObject();
	}
	
	private void createDailyRolling(long date) {
		File dir = new File(this.root, Long.toString(date));
		dir.mkdir();
		
		this.maxDailySummary = new JSONFile(new File(dir, "max"));
		this.maxDailyData = this.maxDailySummary.getJSONObject();
		
		this.minDailySummary = new JSONFile(new File(dir, "min"));
		this.minDailyData = this.minDailySummary.getJSONObject();
		
		this.avgDailySummary = new JSONFile(new File(dir, "avg"));
		this.avgDailyData = this.avgDailySummary.getJSONObject();
		
		this.dir = dir;
	}
	
	/**
	 * Roll.
	 *
	 * @param key the key
	 * @param value the value
	 * @throws IOException Signals that an I/O exception has occurred.
	 */
	
	public void roll(long value) throws IOException {
		Calendar calendar = Calendar.getInstance();
		long now;
		int hour;
		String key;
		
		calendar.set(Calendar.MILLISECOND, 0);
		calendar.set(Calendar.SECOND, 0);
		
		now = calendar.getTimeInMillis();
		hour = calendar.get(Calendar.HOUR_OF_DAY);
		key = Long.toString(now);
		
		if (calendar.get(Calendar.MINUTE) %5 == 0) {
			summarize(now, value);
			
			if (hour %6 == 0 && calendar.get(Calendar.MINUTE) == 0) {
				summarize(now);
			}
		}
		
		if (this.last < 0 || hour != this.last) {
			// 실제로 rolling이 발생했거나 프로세스의 시작
			this.last = hour;
			
			
			
			if (hour == 0) {
				// daily rolling 초기화
				createDailyRolling(now);
				
				createFile(Long.toString(now));
			}
			else {
				// rolling
				calendar.set(Calendar.MINUTE, 0);
				
				createFile(Long.toString(calendar.getTimeInMillis()));
			}
		}
		
		if (this.file.tryPut(key, value)) {
			// TODO 아래 반복되는 save가 성능에 영향을 주는가 확인 필요함.
			this.file.save();
		}
	}
	
	/**
	 * 
	 * @param now 초단위 이하 절사한 분 값
	 * @param last counter 타입인 경우 값 차이를 구하기 위함
	 * @throws IOException 
	 */
	private void summarize(long now, long last) throws IOException {
		String key;
		long var, i, cnt, value;
		long max = 0;
		long min = 0;
		double sum = 0;
		boolean b;
	
		for (i = 0, cnt = 0, b = false, var = now -MINUTE; i < 5; i++, var -= MINUTE) {
			key = Long.toString(var);
			
			if (this.data.has(key)) {
				switch (this.type) {
				case GAUGE:
					value = this.data.getLong(key);
					
					if (b) {
						max = Math.max(max, value);
						min = Math.min(min, value);
						sum += value;
					}
					else {
						max = value;
						min = value;
						sum = value;
						
						b = true;
					}
					
					cnt++;
					
					break;
				case COUNTER:
					value = this.data.getLong(key);
					
					if (b) {
						max = Math.max(max, last - value);
						min = Math.min(min, last - value);
						
						last = value;
					
					}
					else {
						max = last - value;
						min = last - value;
						sum = last - value;
						
						b = true;
					}
				
					last = value;
					
					break;
				}
				
			}
		}
		
		if (b) {
			key = Long.toString(now);
			
			this.maxDailySummary.put(key, max);
			this.maxDailySummary.save();
			
			this.minDailySummary.put(key, min);
			this.minDailySummary.save();
			
			this.avgDailySummary.put(key, (long)(sum / cnt));
			this.avgDailySummary.save();
		}
	}
	
	private void summarize(long now) throws IOException {
		String key;
		long var, i, cnt, value;
		long max = 0;
		long min = 0;
		double sum = 0;
		boolean bMax, bMin, bAvg;
	
		for (i = 0, cnt = 0, bMax = bMin = bAvg = false, var = now -MINUTE5; i < 72; i++, var -= MINUTE5) {
			key = Long.toString(var);
			
			if (this.maxDailyData.has(key)) {
				value = this.maxDailyData.getLong(key);
				
				if (bMax) {
					max = Math.max(max, value);
				}
				else {
					max = value;
					
					bMax = true;
				}
			}
			
			if (this.minDailyData.has(key)) {
				value = this.minDailyData.getLong(key);
				
				if (bMin) {
					min = Math.min(min, value);
				}
				else {
					min = value;

					bMin = true;
				}
			}
			
			if (this.avgDailyData.has(key)) {
				value = this.avgDailyData.getLong(key);
				
				if (bAvg) {
					sum += value;
				}
				else {
					sum = value;
					
					bAvg = true;
				}
				
				cnt++;
			}
		}
		
		key = Long.toString(now);
		
		if (bMax) {
			this.maxSummary.put(key, max);
			
			this.maxSummary.save();
		}
		
		if (bMin) {
			this.minSummary.put(key, min);
			
			this.minSummary.save();
		}
		
		if (bAvg) {
			this.avgSummary.put(key, (long)(sum / cnt));
			
			this.avgSummary.save();
		}
	}
	
	public void getData(long base, int size, SCALE scale, String method) {
		long begin;
		long end;
		
		Calendar calendar = Calendar.getInstance();
		
		calendar.setTimeInMillis(base);
		calendar.set(Calendar.MILLISECOND, 0);
		calendar.set(Calendar.SECOND, 0);
		
		switch (scale) {
		case MINUTE:	
			end = calendar.getTimeInMillis();
			begin = end - (size -1) * MINUTE;
			
			getMinuteData(begin, end);
			
			break;
		case MINUTE5:
			calendar.set(Calendar.MINUTE, calendar.get(Calendar.MINUTE) /5 *5);
			
			end = calendar.getTimeInMillis();
			begin = end - (size -1) *MINUTE5;
			
			getMinute5Data(begin, end, method);
			
			break;
		case HOUR6:
			calendar.set(Calendar.MINUTE, 0);
			calendar.set(Calendar.HOUR_OF_DAY, calendar.get(Calendar.HOUR_OF_DAY) /6 *6);
			
			end = calendar.getTimeInMillis();
			begin = end - (size -1) * HOUR6;
			
			getHour6Data(begin, end, method);
			break;
		}
	}
	
	public JSONObject getMinuteData(long begin, long end) {
		JSONObject result = new JSONObject();
		JSONData data = new JSONData(root);
		Long value;
		
		for (long date = begin; date < end; date += MINUTE5) {
			value = data.get(date);
			
			if (value != null) {
				result.put(Long.toString(date), value);
			}
		}
		
		return result;
	}
	
	public JSONObject getMinute5Data(long begin, long end, String method) {
		JSONObject result = new JSONObject();
		JSONSummaryData data = new JSONSummaryData(root, method);
		Long value;
		
		for (long date = begin; date < end; date += MINUTE5) {
			value = data.get(date);
			
			if (value != null) {
				result.put(Long.toString(date), value);
			}
		}
		
		return result;
	}
	
	private JSONObject getHour6Data(long begin, long end, String method) {
		JSONObject result = new JSONObject();
		String key;
		JSONObject data;
		
		if ("max".equals(method)) {
			data = this.maxData;
		}
		else if ("min".equals(method)) {
			data = this.minData;
		}
		else if ("avg".equals(method)) {
			data = this.avgData;
		}
		else {
			return result;
		}
		
		for (long date = begin; date < end; date += HOUR6) {
			key = Long.toString(date);
			
			if (data.has(key)) {
				result.put(key, data.getLong(key));
			}
		}
		
		return result;
	}
	
}

