const array = [
  "admins",
  "conversations",
  "elements",
  "messages",
  "notifications",
  "payment_accounts",
  "profiles",
  "users",
  "user_tokens",
];

/**
 * @description Clean DB
 */
export const cleanDB = (_db: any) => {
  for (let index = 0; index < array.length; index++) {
    const element = array[index];
    _db
      .model(element)
      .deleteMany({})
      .then((resp: any) => {
        console.log(element.toUpperCase(), "<= resp =>", resp);
      })
      .catch((err: any) =>
        console.log(element.toUpperCase(), "<= err =>", err),
      );
  }
};
