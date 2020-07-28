package com.sb.apps.util;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.OutputStreamWriter;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

import org.apache.commons.lang3.StringUtils;

import com.matrixone.apps.domain.util.EnoviaResourceBundle;
import com.matrixone.apps.domain.util.FrameworkUtil;
import com.matrixone.apps.domain.util.MapList;
import com.matrixone.apps.domain.util.MqlUtil;
import com.matrixone.apps.domain.util.PersonUtil;

import matrix.db.Context;
import matrix.util.StringList;

public class sbMailUtil {
	
	public static final String MYTASK = "MYTASK";
	public static final String TREE = "TREE";

	public static String generateHeading(String heading, int size) throws Exception{
		StringBuffer sbReturn = new StringBuffer();
		sbReturn.append("<h").append(size).append(">");
		sbReturn.append(heading);
		sbReturn.append("</h").append(size).append(">");
		return sbReturn.toString();
	}
	
	public static String generateForm(Context context, LinkedHashMap<String,String> mData) throws Exception{
		StringBuffer sbReturn = new StringBuffer();
		sbReturn.append("<table style='" + getFormTableTagStyle() + "'>");
		
		String sKey = null;
		String sValue = null;
		
		Iterator<String> it = mData.keySet().iterator();
		
		while ( it.hasNext() )
		{
			sbReturn.append("<tr>");
			
			sKey = it.next();
			sValue = mData.get(sKey);
			
			sbReturn.append("<td style='" + getFormLabelTagStyle() + "'>");
				sbReturn.append( sKey );
			sbReturn.append("</td>");
			sbReturn.append("<td style='" + getFormFieldTagStyle() + "'>");
				sbReturn.append( sValue );
			sbReturn.append("</td>");
			
			sbReturn.append("</tr>");
		}
		
		sbReturn.append("</table>");
		
		System.out.println(sbReturn.toString());
		
		return sbReturn.toString();
	}
	
	public static String generateForm(Context context, Map mData, StringList slLabel, StringList slKey) throws Exception{
		StringBuffer sbReturn = new StringBuffer();
		sbReturn.append("<table style='" + getFormTableTagStyle() + "'>");
		
		String sKey = null;
		String sLinkKey = null;
		String sOID = null;
		String sLinkExpr = "";
		String[] sKeyArr = null;
		String sValue = null;
		
		for (int k = 0; k < slLabel.size(); k++)
		{
			sKey = (String) slKey.get(k);
			sLinkExpr = "";
			if ( sKey.indexOf("|LINK|") > -1 )
			{
				sKeyArr = sKey.split("\\|LINK\\|");
				sKey = sKeyArr[0];
				sLinkKey = sKeyArr[1];
				sOID = (String) mData.get(sLinkKey);
				sLinkExpr = generateLink(context, sOID);
				if ( sKeyArr.length >= 3 )
				{
					sLinkExpr += sKeyArr[2];
				}
			}
			else
			{
				sValue = getCellValue(context, mData, sKey);
			}
			
			sbReturn.append("<tr>");
				sbReturn.append("<td style='" + getFormLabelTagStyle() + "'>");
					sbReturn.append( slLabel.get(k) );
				sbReturn.append("</td>");
				sbReturn.append("<td style='" + getFormFieldTagStyle() + "'>");
				if ( StringUtils.isNotEmpty(sLinkExpr) )
				{
					sbReturn.append("<a href='").append(sLinkExpr).append("' target='_blank' style='" + getAnchorTagStyle() + "'>");
					sbReturn.append( mData.get( sKey ) );
					sbReturn.append("</a>");
				}
				else
				{
					sbReturn.append( sValue );
				}
				sbReturn.append("</td>");
			sbReturn.append("</tr>");
		}
		
		sbReturn.append("</table>");
		
		System.out.println(sbReturn.toString());
		
		return sbReturn.toString();
	}
	
	public static String generateTable(Context context, Map mData, StringList slHeader, StringList slKey) throws Exception{
		MapList mlData = new MapList();
		mlData.add(mData);
		return generateTable(context, mlData, slHeader, slKey, null);
	}
	
	public static String generateTable(Context context, MapList mlData, StringList slHeader, StringList slKey) throws Exception{
		return generateTable(context, mlData, slHeader, slKey, null);
	}
	
	public static String generateTable(Context context, MapList mlData, StringList slHeader, StringList slKey, Map<String, String> columnWidthMap) throws Exception{
		if ( columnWidthMap == null )
		{
			columnWidthMap = new HashMap<String, String>();
		}
		
		StringBuffer sbReturn = new StringBuffer();
		sbReturn.append("<table style='" + getListTableTagStyle() + "'>");
		sbReturn.append("<tbody style='" + getListTBodyTagStyle() + "'>");
		
		// header row
		sbReturn.append("<tr style='" + getListTRTagStyle() + "'>");
		String sHeader = null;
		String sColumnWidth = null;
		String sColumnWidthExpr = null;
		for (int k = 0; k < slHeader.size(); k++)
		{
			sHeader = slHeader.get(k);
			sColumnWidth = columnWidthMap.get(sHeader);
			sColumnWidthExpr = getColumnWidthExpr(sColumnWidth);
			sbReturn.append("<th style='" + getListTHTagStyle() + sColumnWidthExpr + "'>");
				sbReturn.append( sHeader );
			sbReturn.append("</th>");
		}
		sbReturn.append("</tr>");
		
		// content rows
		Map<String, Object> mData = null;
		String sTDStyle = null;
		String sKey = null;
		String sLinkKey = null;
		String sOID = null;
		String sLinkExpr = "";
		String[] sKeyArr = null;
		String sValue = null;
		
		if ( mlData != null && mlData.size() > 0 )
		{
			for (int k = 0; k < mlData.size(); k++)
			{
				mData = (Map) mlData.get(k);
				if ( k%2 == 0 )
				{
					sTDStyle = "background-color: #fff;";
				}
				else
				{
					sTDStyle = "background-color: #f3f3f3;";
				}
				sbReturn.append("<tr style='" + getListTRTagStyle() + "'>");
					for (int m = 0; m < slKey.size(); m++)
					{
						sKey = (String) slKey.get(m);
						sLinkExpr = "";
						if ( sKey.indexOf("|LINK|") > -1 )
						{
							sKeyArr = sKey.split("\\|LINK\\|");
							sKey = sKeyArr[0];
							sLinkKey = sKeyArr[1];
							sOID = (String) mData.get(sLinkKey);
							sLinkExpr = generateLink(context, sOID);
						}
						else
						{
							sValue = getCellValue(context, mData, sKey);
						}
						
						sbReturn.append("<td style='" + getListTDTagStyle() + sTDStyle + "'>");
						if ( StringUtils.isNotEmpty(sLinkExpr) )
						{
							sbReturn.append("<a href='").append(sLinkExpr).append("' target='_blank' style='" + getAnchorTagStyle() + "'>");
							sbReturn.append( mData.get( sKey ) );
							sbReturn.append("</a>");
						}
						else
						{
							sbReturn.append( sValue );
						}
						sbReturn.append("</td>");
					}
				sbReturn.append("</tr>");
			}
		}
		else
		{
			sbReturn.append("<tr>");
				sbReturn.append("<td colspan='").append(slHeader.size()).append("'>");
					sbReturn.append(EnoviaResourceBundle.getFrameworkStringResourceProperty(context, "emxFramework.PageHistory.NoResultsFound", context.getLocale()));
				sbReturn.append("</td>");
			sbReturn.append("</tr>");
		}
		
		
		sbReturn.append("</tbody>");
		sbReturn.append("</table>");
		
		System.out.println(sbReturn.toString());
		
		return sbReturn.toString();
	}
	
	public static String generateLink(Context context, String objectId) throws Exception{
		return getLink(context, TREE, objectId);
	}
	
	public static String getLink(Context context, String mode, String... args) throws Exception{
		try {
			String sMCSUrl = context.getCustomData("login_mcsurl");
			
			String sURLList = MqlUtil.mqlCommand(context, "print page $1 select $2 dump", "sbLinkURL", "content");
			StringList slURL = FrameworkUtil.splitString(sURLList, "\n");
			String sURL = null;
			mode = mode.toUpperCase();
			
			for (int k = 0; k < slURL.size(); k++)
			{
				sURL = slURL.get(k);
				if ( sURL.indexOf(mode + "=") == 0 )
				{
					sURL = sURL.replace(mode + "=", "");
					for (int m = 0; m < args.length; m++)
					{
						sURL = sURL.replace("$" + (m + 1), args[m]);
					}
					break;
				}
			}
			
			return sMCSUrl + sURL;
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
	}
	
	public static String generatePopupLink(String link) throws Exception{
		return new StringBuffer("javascript:window.open(\"").append(link).append("\"")
		.append(", \"\"")
		.append(", \"width=800, height=600, left=500, top=300, resizable=yes\")")
		.toString();
	}
	
	private static String getCellValue(Context context, Map mData, String sKey) throws Exception{
		String sValue = null;
		if ( sKey.indexOf("|USER|") > -1 )
		{
			sKey = sKey.replace("|USER|", "");
			sValue = (String) mData.get(sKey);
			if ( StringUtils.isNotEmpty(sValue) )
			{
				sValue = PersonUtil.getFullName(context, sValue);
			}
			else
			{
				sValue = "";
			}
		}
		else if ( sKey.indexOf("|DATE|") > -1 )
		{
			sKey = sKey.replace("|DATE|", "");
			sValue = (String) mData.get(sKey);
			if ( StringUtils.isNotEmpty(sValue) )
			{
				sValue = sbDateUtil.getFormattedDisplayDate(context, sValue);
			}
			else
			{
				sValue = "";
			}
		}
		else
		{
			Object oValue = mData.get( sKey );
			if ( oValue instanceof StringList )
			{
				StringList slValue = (StringList) mData.get( sKey );
				sValue = slValue.join(",");
			}
			else
			{
				sValue = (String) mData.get( sKey );
			}
		}
		
		return sValue;
	}
	
	private static String getColumnWidthExpr(String columnWidth) throws Exception{
		String sReturn = "";
		if ( StringUtils.isNotEmpty(columnWidth) )
		{
			sReturn = " width:" + columnWidth + ";";
		}
		return sReturn;
	}
	
	public static String getDefaultStyle() throws Exception{
		return "h2 { font-family: \"3DS Light\", Arial, Helvetica, sans-serif; font-weight: bold; font-size: 16px; color: #5B5D5E; letter-spacing: 0; height: 14px; white-space: nowrap; }";
	}
	
	public static String getTableStyle() throws Exception{
		StringBuffer sbStyle = new StringBuffer();
		sbStyle.append("body { font-family: Arial, Helvetica, Sans-serif; font-size: 15px; } ");
		sbStyle.append("tbody { display: table-row-group; vertical-align: middle; border-color: inherit; } ");
		sbStyle.append("tr { display: table-row; vertical-align: inherit; border-color: inherit; } ");
		sbStyle.append("th { text-align: left; } ");
		sbStyle.append("table.list { border-collapse: collapse; width: 100%; margin: 6px 0 0 0; border: 1px solid #b4b6ba; } ");
		sbStyle.append("table.list tr th { color: #2a2a2a; font-weight: bold; text-decoration: none; min-height: 26px; padding: 10px 5px 10px 5px; background: linear-gradient(to bottom, #f5f6f7 0%,#e2e4e3 100%); border-top: 1px solid #b4b6ba; border-left: 1px solid #b4b6ba; border-bottom: 1px solid #b4b6ba; } ");
		sbStyle.append("table.list tr.even td { background-color: #fff; } ");
		sbStyle.append("table.list tr.odd td { background-color: #f3f3f3; } ");
		sbStyle.append("a { text-decoration: none; color: #288FD1; cursor: pointer; }");
		
		return sbStyle.toString();
	}
	
	public static String getFormStyle() throws Exception{
		StringBuffer sbStyle = new StringBuffer();
		sbStyle.append("table.form { border-collapse: collapse; width: 100%; margin: 0; box-sizing: border-box; max-width: 100%; border: 1px solid #d8d8d8; } ");
		sbStyle.append("table.form tr td { padding: 4px 12px; border-bottom: 1px solid #d8d8d8; } ");
		sbStyle.append("td.label { border-left: medium none; background-color: #f8f8f8; color: #2a2a2a; white-space: normal; width: 150px; word-break: normal; display: table-cell; font-size: 15px; font-weight: normal; text-align: left; vertical-align: middle; line-height: 18px; } ");
		sbStyle.append("td.field { background-color: #fff; } ");
		
		return sbStyle.toString();
	}
	
	public static String getFormTableTagStyle() throws Exception{
		return "border-collapse: collapse; width: 70%; margin: 0; box-sizing: border-box; max-width: 100%; border: 1px solid #d8d8d8;";
	}
	
	public static String getFormLabelTagStyle() throws Exception{
		return "padding: 4px 12px; border-bottom: 1px solid #d8d8d8; border-left: medium none; background-color: #f8f8f8; color: #2a2a2a; white-space: normal; width: 150px; word-break: normal; display: table-cell; font-size: 15px; font-weight: normal; text-align: left; vertical-align: middle; line-height: 1.5em;";
	}
	
	public static String getFormFieldTagStyle() throws Exception{
		return "padding: 4px 12px; border-bottom: 1px solid #d8d8d8; background-color: #fff;";
	}
	
	public static String getListTableTagStyle() throws Exception{
		return "border-collapse: collapse; width: 100%; margin: 6px 0 0 0; border: 1px solid #b4b6ba;";
	}
	
	public static String getListTBodyTagStyle() throws Exception{
		return "display: table-row-group; vertical-align: middle; border-color: inherit;";
	}

	public static String getListTRTagStyle() throws Exception{
		return "display: table-row; vertical-align: inherit; border-color: inherit;";
	}

	public static String getListTHTagStyle() throws Exception{
		return "color: #2a2a2a; font-weight: bold; text-decoration: none; min-height: 26px; padding: 10px 5px 10px 5px; background: linear-gradient(to bottom, #f5f6f7 0%,#e2e4e3 100%); border-top: 1px solid #b4b6ba; border-left: 1px solid #b4b6ba; border-bottom: 1px solid #b4b6ba; text-align: left; display: table-cell; vertical-align: inherit;";
	}

	public static String getListTDTagStyle() throws Exception{
		return "display: table-cell; vertical-align: inherit; border-bottom: 1px solid #d8d8d8; ";
	}
	
	public static String getAnchorTagStyle() throws Exception{
		return "text-decoration: none; color: #288FD1; cursor: pointer;";
	}
	
	public static String wrapBody(String str) throws Exception{
		try {
			StringBuffer sbContent = new StringBuffer();
			sbContent.append("<html>");
			sbContent.append("<meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\" />");
			sbContent.append("<head>");
			/*
			 * 실제 메일이 발송될 때 컨텐츠의 style tag를 무시함. Inline element로 적용하도록 변경
				sbContent.append("<style>");
					sbContent.append(getDefaultStyle());
					sbContent.append(getTableStyle());
					sbContent.append(getFormStyle());
				sbContent.append("</style>");
			 */
			sbContent.append("</head>");
			sbContent.append("<body style='font-family: Arial, Helvetica, Sans-serif; font-size: 15px;'>");
				sbContent.append(str);
			sbContent.append("</body>");
			sbContent.append("</html>");
			
			System.out.println(sbContent.toString());
			
			return sbContent.toString();
		} catch (Exception e) {
			e.printStackTrace();
			throw e;
		}
	}
	
	public static void createMailFile(String sSubject, StringList sTo, String content) throws Exception{
//		FileWriter fw = null;
		BufferedWriter bw = null;
		try {
			Date today = new Date();
			SimpleDateFormat sdf = new SimpleDateFormat("yyyyMMdd");
			String sToday = sdf.format(today);
			File file = new File("C:\\DassaultSystemes\\MAIL\\" + sToday);
			if ( !file.exists() )
			{
				file.mkdirs();
			}
			
			sdf.applyPattern("HH;mm;ss");
			String sNow = sdf.format(today);
			File html = new File(new StringBuffer("C:\\DassaultSystemes\\MAIL\\")
					.append(sToday)
					.append(java.io.File.separatorChar)
					.append(sNow)
					.append("@")
					.append(sSubject.replaceAll("/", "-"))
					.append("@")
					.append(sTo.join(","))
					.append(".html")
					.toString());
			
			bw = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(html), "utf-8"));
			bw.write(content);
			bw.flush();
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			if ( bw != null )
			{
				bw.close();
			}
		}
	}
}
