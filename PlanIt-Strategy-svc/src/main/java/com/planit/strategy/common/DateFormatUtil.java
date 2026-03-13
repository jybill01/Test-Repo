/**
 * [PlanIt Strategy Service - Date Format Utility]
 * 날짜 형식 변환 유틸리티
 */
package com.planit.strategy.common;

import java.time.LocalDate;

public class DateFormatUtil {
    
    /**
     * LocalDate를 proto 날짜 형식(yyyy-MM-dd)으로 변환
     * 
     * @param date LocalDate 객체
     * @return "yyyy-MM-dd" 형식의 문자열
     */
    public static String toProtoDateFormat(LocalDate date) {
        if (date == null) {
            return null;
        }
        return date.toString(); // LocalDate.toString()은 기본적으로 yyyy-MM-dd 형식
    }
}
