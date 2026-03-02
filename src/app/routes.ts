export const routes = {
  home: "/",
  articles: "/articles",
  authors: "/authors",
  topics: "/topics",
  about: "/about",
  signin: "/signin",
  register: "/register",
  dashboard: "/dashboard",
  editor: "/dashboard/editor",
  editorById: (id: string | number) => `/dashboard/editor/${id}`,
};
