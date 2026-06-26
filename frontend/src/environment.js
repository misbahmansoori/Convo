let IS_PROD = import.meta.env.PROD;
const server = IS_PROD ?
    "https://apnacollegebackend.onrender.com" :

    "http://localhost:8000"


export default server;