# navigation-server

###Amazon Web Server
    Public IP: 54.154.109.216
    SSH on port 22 with Private Key

###MySQL details
    SQL root:gibsonXC40
    SQL navuser:finestMJ76

###Windows: Initial server setup
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
    
###Linux: Initial server setup
#####Packages to install
    sudo apt-get install nodejs
    sudo apt-get install npm
    sudo apt-get install nodejs-legacy
    sudo apt-get install mysql-server

###Login to MYSQL Server
    mysql -u root -p
    (enter password when prompted)
    
###Running the server
    DEBUG=navigationserver:* npm start
