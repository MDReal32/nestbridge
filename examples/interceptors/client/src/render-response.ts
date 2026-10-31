export const renderResponse = (route: string, declaredRead: string, response: unknown) => {
  const app = document.querySelector<HTMLDivElement>('#app');

  if (app === null) {
    return;
  }

  const section = document.createElement('section');
  const heading = document.createElement('h2');
  const declared = document.createElement('p');
  const raw = document.createElement('pre');

  heading.textContent = route;
  declared.textContent = `declared type read: ${declaredRead}`;
  raw.textContent = JSON.stringify(response, null, 2);

  section.append(heading, declared, raw);
  app.append(section);
};
