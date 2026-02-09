
import { Question, QuizAttempt } from "../types";

/**
 * World-class persistence service.
 * In a production environment, these would call a REST API that writes to a server-side JSON file or DB.
 * For this environment, we provide the API structure and use localStorage as the "database" fallback.
 */

const API_ENDPOINT = "/api/data"; // Hypothetical endpoint for server-side JSON storage

export const storage = {
  async getQuestions(): Promise<Question[]> {
    try {
      // In a real server setup, this would fetch the JSON file
      // const response = await fetch(API_ENDPOINT + '/questions');
      // return await response.json();
      const local = localStorage.getItem('mcq_questions');
      return local ? JSON.parse(local) : [];
    } catch (e) {
      console.error("Storage Error:", e);
      return [];
    }
  },

  async saveQuestions(questions: Question[]): Promise<void> {
    try {
      // Logic for server-side JSON write (requires a backend listener)
      /*
      await fetch(API_ENDPOINT + '/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questions)
      });
      */
      localStorage.setItem('mcq_questions', JSON.stringify(questions));
    } catch (e) {
      console.error("Storage Error:", e);
    }
  },

  async getAttempts(): Promise<QuizAttempt[]> {
    const local = localStorage.getItem('mcq_attempts');
    return local ? JSON.parse(local) : [];
  },

  async saveAttempts(attempts: QuizAttempt[]): Promise<void> {
    localStorage.setItem('mcq_attempts', JSON.stringify(attempts));
  }
};
