const apiRootDomain = 'https://api.nodeauth.dev';

async function logout() {
  try {
    await fetch(`${apiRootDomain}/api/logout`, { method: 'POST' });
  } catch (error) {
    console.error(error);
  }
}

(() => {
  const registrationForm = document.getElementById('registration-form');
  registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      const values = Object.values(registrationForm).reduce((obj, field) => {
        if (field.name) {
          obj[field.name] = field.value;
        }

        return obj;
      }, {});

      await fetch(`${apiRootDomain}/api/register`, {
        method: 'POST',
        body: JSON.stringify(values),
        credentials: 'include',
        headers: { 'Content-type': 'application/json; charset=UTF-8' },
      });
    } catch (error) {
      console.error(error);
    }
  });
  
  const loginForm = document.getElementById('login-form');
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      const values = Object.values(loginForm).reduce((obj, field) => {
        if (field.name) {
          obj[field.name] = field.value;
        }

        return obj;
      }, {});

      const res = await fetch(`${apiRootDomain}/api/authorize`, {
        method: 'POST',
        body: JSON.stringify(values),
        credentials: 'include',
        headers: { 'Content-type': 'application/json; charset=UTF-8' },
      });
    } catch (error) {
      console.error(error);
    }
  });
})();