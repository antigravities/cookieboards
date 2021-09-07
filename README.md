# CookieBoards
Why take screenshots of your worthless stats when you can show them off on a silly web site?

## Install

### For production

```sh
git clone git@github.com:antigravities/cookieboards.git
cd cookieboards
touch cookie.json
touch ipBlacklist.json
npm i
HOST=cookie.your.domain PORT=5000 PASSWORD=yourpassword npm start
```

### For development

We will infer you wanted to start your development server on `https://localhost:5000`

```sh
git clone git@github.com:antigravities/cookieboards.git
cd cookieboards
touch cookie.json
touch ipBlacklist.json
npm i
PASSWORD=yourpassword npm start
```


## License
(c) me

[GNU AGPL](https://www.gnu.org/licenses/agpl-3.0.en.html)
