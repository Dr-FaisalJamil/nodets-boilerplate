// module imports
// import axios from "axios";

class AxiosManager {
  private static instance: AxiosManager | null = null;

  constructor() {
    if (!AxiosManager.instance) {
      AxiosManager.instance = this;
    }
    return AxiosManager.instance;
  }

  /**
   * @description Send axios request
   * @param {string} method request method
   * @param {string} url request url
   * @param {Object} data request data
   * @param {Object} query request query params
   * @param {Object} headers request headers
   * @returns {Object} response
   */
  async send(params: any) {
    const { method, url, data, headers, query } = params;
    let urlParams = "";
    if (query) {
      urlParams = "?";
      Object.entries(query).forEach(([key, value]) => {
        urlParams += `${key}=${value}&`;
      });
      urlParams = urlParams.slice(0, urlParams.length - 1);
    }
    try {
      // const response = await axios({
      //   method, // Required, HTTP method, a string, e.g. POST, GET, PUT, PATCH, DELETE
      //   url: url + urlParams, // Required, HTTP url, a string, e.g. http://localhost:5003
      //   data, // Optional, HTTP Request Body, an object, e.g. { "text": "test" }
      //   headers, // Optional, HTTP headers, an object, e.g. { "Content-Type": "application/json" }
      // });
      // return response.data;
    } catch (error: any) {
      console.error("Axios Error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "An unknown error occurred";
      throw new Error(errorMessage);
    }
  }
}

export default new AxiosManager();
// Object.freeze(new AxiosManager());
