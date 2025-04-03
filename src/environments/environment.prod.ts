export const environment = {
    production: false,
    apiBaseUrl: 'http://localhost:8080/api/v1',  // Replace with your actual API URL
    marketPlace: {
        BVMF: {
            apiUrl: 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={code}.SA&apikey=KH1AWC9WXP5WBUQ2'
        }
    }
}