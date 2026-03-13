/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaseApiService, apiClients } from './base';

/**
 * 챗봇 질의 요청 타입
 */
export interface ChatbotQueryRequest {
  query: string;
}

/**
 * 챗봇 응답 타입
 */
export interface ChatbotResponse {
  answer: string;
  sources: string[];
  generatedAt: string;
}

/**
 * Chatbot Service API
 * AI 챗봇 질의응답 제공
 */
class ChatbotService extends BaseApiService {
  constructor() {
    super(apiClients.insight);
  }

  /**
   * 챗봇 질의
   * 사용자의 질의를 AI 챗봇에 전달하여 답변을 받습니다.
   * 
   * @param query - 사용자 질의 내용
   * @returns ChatbotResponse
   */
  async queryChatbot(query: string): Promise<ChatbotResponse> {
    return this.post<ChatbotResponse>('/api/v1/insight/chat/query', {
      query,
    });
  }
}

export const chatbotService = new ChatbotService();
