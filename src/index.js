const express = require('express');
const helmet = require("helmet");
const app = express();

const dotenv = require('dotenv');
const cors = require('cors')
const fs = require("fs");
const http = require("http");
const https = require("https");


dotenv.config()

const corsOptions = {
  origin: "http://localhost:3000",
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true
};

const authRoute = require('./routes/auth');
const uploadImageRoute = require('./routes/upload_image');
const noticeRoute = require('./routes/notice');
const noticeCommentRoute = require('./routes/notice_comment');
const inquireRoute = require('./routes/inquire');
const inquireCommentRoute = require('./routes/inquire_comment');
const productRoute = require('./routes/product');
const productCommentRoute = require('./routes/product_comment');
const claimRoute = require('./routes/claim');
const claimCommentRoute = require('./routes/claim_comment');
const businessApprovalRoute = require('./routes/business_approval');
const businessApprovalCommentRoute = require('./routes/business_approval_comment');
const orderRegistrationRoute = require('./routes/order_registration');
const orderRegistrationCommentRoute = require('./routes/order_registration_comment');
const portfolioRoute = require('./routes/portfolio')
const sliderRoute = require('./routes/slider')
app.use([
  express.static("public"),
  express.urlencoded({ extended: false }),
  express.json(),
  cors(),
  helmet()
]);

app.use(express.json())
app.use('/api/auth', authRoute);
app.use('/api/upload_image', uploadImageRoute);
app.use('/api/notice', noticeRoute);
app.use('/api/notice_comment', noticeCommentRoute);
app.use('/api/inquire', inquireRoute);
app.use('/api/inquire_comment', inquireCommentRoute);
app.use('/api/product', productRoute);
app.use('/api/product_comment', productCommentRoute);
app.use('/api/claim', claimRoute);
app.use('/api/claim_comment', claimCommentRoute);
app.use('/api/business_approval', businessApprovalRoute);
app.use('/api/business_approval_comment', businessApprovalCommentRoute);
app.use('/api/order_registration', orderRegistrationRoute);
app.use('/api/order_registration_comment', orderRegistrationCommentRoute);
app.use('/api/portfolio', portfolioRoute);
app.use('/api/slider', sliderRoute);


/*
const options = {
  key: fs.readFileSync(`/etc/letsencrypt/live/bgroup.tk/privkey.pem`, 'utf8'),
  cert: fs.readFileSync(`/etc/letsencrypt/live/bgroup.tk/cert.pem`, 'utf8'),
  ca: fs.readFileSync(`/etc/letsencrypt/live/bgroup.tk/chain.pem`, 'utf8'),
};
*/
/*
http.createServer(app).listen(5000, () => {
	console.log('HTTP Server running on port 80');
});

https.createServer(options, app).listen(443, () => {
	console.log('HTTPS Server running on port 443');
});
*/

const port = process.env.PORT;
app.listen(port, () => {
  console.log('connect')
})