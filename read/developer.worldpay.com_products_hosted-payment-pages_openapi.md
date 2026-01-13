# Hosted Payment Pages (HPP) API
Our low-code integration to take payments securely.
__Authentication header__
 ```
 Authorization: {your_credentials}
 ```
Replace `{your_credentials}` with your base64-encoded Basic Auth username and password given to
you by your Implementation Manager.
<br /> <br />
You **must** use the `Authorization` header for any request you send to our Hosted Payment Pages
APIs.
__Accept header__
 ```
 Accept: application/vnd.worldpay.payment_pages-v1.hal+json
 ```
We use the Accept header to identify which version of our API you are using. You must use the
Accept header for any request you send to our Hosted Payment Pages APIs.
<br /><br />
__DNS whitelisting__
Whitelist the following URLs:
* `https://try.access.worldpay.com/`
* `https://access.worldpay.com/`
Please ensure you use DNS whitelisting, not explicit IP whitelisting.
Version: 1
Metadata:
 - category: ["3DS","Card Payments","Risk Assessments","Tokens","Wallets","Query Payments"]
 - business: ["SMB (Worldpay eCommerce)"]
 - catalog-list: true
 - generated: false
## Servers
Test (Try)
```
https://try.access.worldpay.com
```
Live
```
https://access.worldpay.com
```
## Security
### BasicAuth
Type: http
Scheme: BasicAuth
## Download OpenAPI description
[Hosted Payment Pages (HPP) API](https://developer.worldpay.com/_bundle/products/hosted-paymentpages/@v1/openapi.yaml)
## Other
### Create a new transaction
- [POST /payment_pages](https://developer.worldpay.com/products/hosted-paymentpages/openapi/other/create.md)