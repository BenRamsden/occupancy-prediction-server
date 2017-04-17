# navigation-server

### Amazon Web Server
    Public IP: 54.154.109.216
    SSH on port 22 with Private Key

### MySQL details
    SQL root:gibsonXC40
    SQL navuser:finestMJ76

### Windows: Initial server setup
##### Programs to install
    Node.js
    MySQL Server

##### Run in git directory
    npm install express -g
    npm install express-generator -g
    express NavigationServer
    cd NavigationServer && npm install

### Running the server

    cd NavigationServer
    SET DEBUG=navigationserver:* & npm start
    
### Linux: Initial server setup
##### Packages to install
    sudo apt-get install nodejs
    sudo apt-get install npm
    sudo apt-get install nodejs-legacy
    sudo apt-get install mysql-server
    
### Git pull from this repo
    git clone http://.....
    
### Download npm dependancies
    cd navigation-server
    npm install

### Login to MySQL Server
    mysql -u root -p
    (enter password when prompted)
    
### Initialize MySQL Database
In the mysql shell call

    source TableCreation.sql    
    
### Running the server
    DEBUG=navigationserver:* npm start
    
Or use .sh files provided
    
    ./start.sh

### Connect to server inside VM
Make the first network adapter to the VM a bridged connection,
then run this command on the server

    sudo ifconfig
    
Find out the IP address of the VM server, connect to it on the host
    
    http://IPHERE:8080
    
### Reroute to port 80
    
To reroute the traffic to 8080 to 80 i ran the command

    sudo iptables -A PREROUTING -t nat -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 8080

Check the status of the preroute

    sudo iptables -L -vt nat

### Prevent MySQL only_full_group_by

error when grouping on non-dependancy columns

Temp solution - run in mysql command line

    SET sql_mode = ''
    
Permanant solution - add theses 2 lines to the bottom of /etc/mysql/my.cnf

    [mysqld]
    sql-mode=""
