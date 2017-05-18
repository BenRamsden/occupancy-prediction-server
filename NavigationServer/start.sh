#!/bin/bash

#nohup DEBUG=navigationserver:* npm start > navigationserver_nohup.log 2>&1&

#CLEAR NAT TABLE RULES
sudo iptables -t nat -F

#Route external port 80 requests to 8000
sudo iptables -t nat -I PREROUTING -p tcp --dport 80 -j REDIRECT --to-ports 8080

ps cax | grep node > /dev/null
if [ $? -eq 0 ]; then
  echo "START: ERROR node process already running."
  exit 0
fi

echo "START: npm start called with nohup"
nohup npm start > navigationserver_nohup.log 2>&1&
