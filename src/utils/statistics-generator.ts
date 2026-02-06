class StatisticsGenerator {
  private static instance: StatisticsGenerator;

  constructor() {
    if (!StatisticsGenerator.instance) {
      StatisticsGenerator.instance = this;
    }
    return StatisticsGenerator.instance;
  }

  /**
   * Generate weekly statistics
   * @param {Object} model mongo database model
   * @param {Object} query query
   * @param {number} year year number
   * @param {number} month month number
   * @param {number} week week number
   * @returns {Object} statistics
   */
  async generateWeeklyStatistics(params: any) {
    const { model } = params;
    let { query, week, month, year } = params;

    if (!model) return null;

    if (!query) query = {};

    const date: any = new Date();
    if (!year) year = date.getFullYear();
    if (!month) month = date.getMonth() + 1;
    if (!week) {
      const initialDate: any = new Date(date.getFullYear(), 0, 1);
      week = Math.ceil(
        Math.floor((date - initialDate) / (24 * 60 * 60 * 1000)) / 7,
      );
    }
    const queryTime = [
      {
        $eq: [
          {
            $year: "$createdAt",
          },
          year,
        ],
      },
      {
        $eq: [
          {
            $month: "$createdAt",
          },
          month,
        ],
      },
      {
        $eq: [
          {
            $week: "$createdAt",
          },
          week,
        ],
      },
    ];

    return await model.aggregate([
      { $match: query },
      {
        $match: {
          $expr: {
            $and: queryTime,
          },
        },
      },
      {
        $project: {
          createdAt: 1,
          dayOfMonth: { $dayOfMonth: "$createdAt" },
          week: { $week: "$createdAt" },
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
      {
        $group: {
          _id: {
            dayOfMonth: "$dayOfMonth",
            week: "$week",
            month: "$month",
            year: "$year",
          },
          count: { $count: {} },
        },
      },
      {
        $project: {
          count: 1,
          _id: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.dayOfMonth",
              // hour: 12,
            },
          },
        },
      },
    ]);
  }

  /**
   * Generate monthly statistics
   * @param {Object} model mongo database model
   * @param {Object} query query
   * @param {number} year year number
   * @param {number} month month number
   * @param {boolean} isCustom custom query check
   * @returns {Object} statistics
   */
  async generateMonthlyStatistics(params: any) {
    const { model, isCustom } = params;
    let { query, month, year } = params;

    if (!model) return null;

    if (!query) query = {};

    const date = new Date();
    if (!year) year = date.getFullYear();
    if (!month) month = date.getMonth() + 1;

    let queryTime: any = [];
    if (!isCustom)
      queryTime = [
        {
          $eq: [
            {
              $year: "$createdAt",
            },
            year,
          ],
        },
        {
          $eq: [
            {
              $month: "$createdAt",
            },
            month,
          ],
        },
      ];

    return await model.aggregate([
      { $match: query },
      {
        $match: {
          $expr: {
            $and: queryTime,
          },
        },
      },
      {
        $project: {
          createdAt: 1,
          dayOfMonth: { $dayOfMonth: "$createdAt" },
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
      {
        $group: {
          _id: { dayOfMonth: "$dayOfMonth", month: "$month", year: "$year" },
          count: { $count: {} },
        },
      },
      {
        $project: {
          count: 1,
          _id: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              day: "$_id.dayOfMonth",
              // hour: 12,
            },
          },
        },
      },
    ]);
  }

  /**
   * Generate yearly statistics
   * @param {Object} model mongo database model
   * @param {Object} query query
   * @param {number} year year number
   * @returns {Object} statistics
   */
  async generateYearlyStatistics(params: any) {
    const { model } = params;
    let { query, year } = params;

    if (!model) return null;

    if (query) query = {};

    const date = new Date();
    if (!year) year = date.getFullYear();

    const queryTime = [
      {
        $eq: [
          {
            $year: "$createdAt",
          },
          year,
        ],
      },
    ];

    return await model.aggregate([
      { $match: query },
      {
        $match: {
          $expr: {
            $and: queryTime,
          },
        },
      },
      {
        $project: {
          createdAt: 1,
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
      },
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          count: { $count: {} },
        },
      },
      {
        $project: {
          count: 1,
          _id: {
            $dateFromParts: {
              year: "$_id.year",
              month: "$_id.month",
              // day: "$_id.dayOfMonth",
              // hour: 12,
            },
          },
        },
      },
    ]);
  }
}

export default new StatisticsGenerator();
// Object.freeze(new StatisticsGenerator());
