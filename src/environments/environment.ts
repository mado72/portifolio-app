export const environment = {
    name: 'production',
    production: true,
    apiBaseUrl: '/api/v1',  // Replace with your actual API URL
    marketPlace: {
        BVMF: {
            apiUrl: 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={code}.SA&apikey=KH1AWC9WXP5WBUQ2'
        }
    }
}