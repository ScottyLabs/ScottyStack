export const helloService = {
  hello: () => {
    return { message: "Hello World!" };
  },

  helloAuthenticated: (user: Express.User) => {
    return { message: `Hello ${user.given_name}!` };
  },

  helloAdmin: (user: Express.User) => {
    return { message: `Hello ${user.given_name}! You are an admin.` };
  },
};
