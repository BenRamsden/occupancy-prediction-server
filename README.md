# navigation-server

###Amazon Web Server
    Public IP: 54.154.109.216
    SSH on port 22 with Private Key

###MySQL details
    SQL root:gibsonXC40
    SQL navuser:finestMJ76

###Initial server setup
#####Programs to install
    Node.js
    MySQL Server

#####Run in git directory
    npm install express -g
    npm install express-generator -g
    express NavigationServer
    cd NavigationServer && npm install

###Running the server

    cd NavigationServer
    SET DEBUG=navigationserver:* & npm start
    
