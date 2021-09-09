# CookieBoards
Why take screenshots of your worthless stats when you can show them off on a silly web site?

## Install

### For production

```sh
wget https://raw.githubusercontent.com/antigravities/cookieboards/master/docker-compose.yml
$EDITOR docker-compose.yml
docker-compose up -d
```

or

```sh
git clone git@github.com:antigravities/cookieboards.git
touch cookie.json
cd cookieboards
npm i
HOST=cookie.your.domain PORT=5000 PASSWORD=yourpassword npm start
```

### For development

Assuming that you wanted to start the server on `https://localhost:5000`:

```sh
git clone git@github.com:antigravities/cookieboards.git
cd cookieboards
touch cookie.json
npm i
PASSWORD=yourpassword npm start
```

## Contributing

I generally won't decline reasonable contributions, but please ensure that you mark commits intended to be merged into this project with a [Developer Certificate of Origin](https://developercertificate.org/) (`Signed-off-by`) header, or a similar attestation in your pull request's body.

## License
&copy; 2021 Alexandra Frock

`formatEveryThirdPower`, `abbreviateNumber` based on code from [Frozen Cookies](https://github.com/Mtarnuhal/FrozenCookies).

[GNU AGPL](https://www.gnu.org/licenses/agpl-3.0.en.html)
