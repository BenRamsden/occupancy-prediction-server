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
    
###Git pull from this repo
    git clone http://.....
    
###Download npm dependancies
    cd navigation-server
    npm install

###Login to MySQL Server
    mysql -u root -p
    (enter password when prompted)
    
###Initialize MySQL Database
In the mysql shell call

    source TableCreation.sql    
    
###Running the server
    DEBUG=navigationserver:* npm start
    
Or use .sh files provided
    
    ./start.sh

###Connect to server inside VM
Create a host only network adapter to the VM,
then run this command on the server

    sudo ifconfig
    
Find out the IP address of the VM server, connect to it in the host
    
    http://IPHERE:3000