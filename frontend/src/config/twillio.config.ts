// src/config/twilio.config.ts hello

export const twilioConfig = {
  accountSid: import.meta.env.VITE_TWILLIO_ACCOUNT_SID,
  authToken: import.meta.env.VITE_TWILLIO_AUTH_TOKEN,
  serviceSid: import.meta.env.VITE_TWILLIO_SERVICE_SID,
  baseUrl: import.meta.env.VITE_TWILLIO_BASE_URL,
};

// Phone number validation utility
export const validatePhoneNumber = (
  phone: string
): { isValid: boolean; formatted: string; error?: string } => {
  if (!phone) {
    return { isValid: false, formatted: "", error: "Phone number is required" };
  }

  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, "");

  // If it starts with +91, it's already formatted
  if (cleaned.startsWith("+91")) {
    if (cleaned.length === 13) {
      return { isValid: true, formatted: cleaned };
    } else {
      return {
        isValid: false,
        formatted: "",
        error: "Invalid Indian phone number length",
      };
    }
  }

  // If it starts with 91, add +
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return { isValid: true, formatted: "+" + cleaned };
  }

  // If it's a 10-digit number, add +91
  if (cleaned.length === 10 && !cleaned.startsWith("0")) {
    return { isValid: true, formatted: "+91" + cleaned };
  }

  return {
    isValid: false,
    formatted: "",
    error: "Invalid phone number format. Use +91XXXXXXXXXX or 10-digit number",
  };
};

// Twilio API client
class TwilioClient {
  private accountSid = twilioConfig.accountSid;
  private authToken = twilioConfig.authToken;
  private serviceSid = twilioConfig.serviceSid;

  private async makeRequest(url: string, method: string, body?: any) {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Basic ${btoa(`${this.accountSid}:${this.authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body ? new URLSearchParams(body).toString() : undefined,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Twilio API error: ${response.status} - ${errorData}`);
    }

    return response.json();
  }

  async sendVerification(phoneNumber: string) {
    const url = `${twilioConfig.baseUrl}/${this.serviceSid}/Verifications`;
    return this.makeRequest(url, "POST", {
      To: phoneNumber,
      Channel: "sms",
    });
  }

  async verifyCode(phoneNumber: string, code: string) {
    const url = `${twilioConfig.baseUrl}/${this.serviceSid}/VerificationCheck`;
    return this.makeRequest(url, "POST", {
      To: phoneNumber,
      Code: code,
    });
  }
}

export const twilioClient = new TwilioClient();
