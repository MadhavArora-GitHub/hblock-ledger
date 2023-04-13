# hblock-ledger


1- Deploy the cluster

2- Add firewall rule to allow requests on external ip of nodes

3-
helm repo add kfs https://kfsoftware.github.io/hlf-helm-charts --force-update

helm install hlf-operator --version=1.8.4 kfs/hlf-operator

4-
export PEER_IMAGE=hyperledger/fabric-peer
export PEER_VERSION=latest

export ORDERER_IMAGE=hyperledger/fabric-orderer
export ORDERER_VERSION=2.4.6

export CA_IMAGE=hyperledger/fabric-ca
export CA_VERSION=latest

5-
kubectl create ns hblock

6-
kubectl hlf ca create  --image=$CA_IMAGE --version=$CA_VERSION --storage-class=standard --capacity=2Gi --name=hospital1-ca --enroll-id=enroll --enroll-pw=enrollpw --namespace=hblock

kubectl hlf ca create  --image=$CA_IMAGE --version=$CA_VERSION --storage-class=standard --capacity=2Gi --name=hospital2-ca --enroll-id=enroll --enroll-pw=enrollpw --namespace=hblock

kubectl hlf ca create  --image=$CA_IMAGE --version=$CA_VERSION --storage-class=standard --capacity=2Gi --name=hospital3-ca --enroll-id=enroll --enroll-pw=enrollpw --namespace=hblock

kubectl hlf ca create  --image=$CA_IMAGE --version=$CA_VERSION --storage-class=standard --capacity=2Gi --name=ord-ca --enroll-id=enroll --enroll-pw=enrollpw --namespace=hblock

7-
kubectl hlf ca register --name=hospital1-ca --user=hospital1-peer1 --secret=peerpw --type=peer --enroll-id=enroll --enroll-secret=enrollpw --mspid=Hospital1MSP --namespace=hblock

kubectl hlf ca register --name=hospital1-ca --user=hospital1-peer2 --secret=peerpw --type=peer --enroll-id=enroll --enroll-secret=enrollpw --mspid=Hospital1MSP --namespace=hblock

kubectl hlf ca register --name=hospital2-ca --user=hospital2-peer1 --secret=peerpw --type=peer --enroll-id=enroll --enroll-secret=enrollpw --mspid=Hospital2MSP --namespace=hblock

kubectl hlf ca register --name=hospital2-ca --user=hospital2-peer2 --secret=peerpw --type=peer --enroll-id=enroll --enroll-secret=enrollpw --mspid=Hospital2MSP --namespace=hblock

8-
kubectl hlf peer create --statedb=couchdb --image=$PEER_IMAGE --version=$PEER_VERSION --storage-class=standard --enroll-id=hospital1-peer1 --mspid=Hospital1MSP --enroll-pw=peerpw --capacity=5Gi --name=hospital1-peer1 --ca-name=hospital1-ca.hblock --namespace=hblock

kubectl hlf peer create --statedb=couchdb --image=$PEER_IMAGE --version=$PEER_VERSION --storage-class=standard --enroll-id=hospital1-peer2 --mspid=Hospital1MSP --enroll-pw=peerpw --capacity=5Gi --name=hospital1-peer2 --ca-name=hospital1-ca.hblock --namespace=hblock

kubectl hlf peer create --statedb=couchdb --image=$PEER_IMAGE --version=$PEER_VERSION --storage-class=standard --enroll-id=hospital2-peer1 --mspid=Hospital2MSP --enroll-pw=peerpw --capacity=5Gi --name=hospital2-peer1 --ca-name=hospital2-ca.hblock --namespace=hblock

kubectl hlf peer create --statedb=couchdb --image=$PEER_IMAGE --version=$PEER_VERSION --storage-class=standard --enroll-id=hospital2-peer2 --mspid=Hospital2MSP --enroll-pw=peerpw --capacity=5Gi --name=hospital2-peer2 --ca-name=hospital2-ca.hblock --namespace=hblock

9-
kubectl hlf ca register --name=hospital1-ca --user=admin --secret=adminpw --type=admin --enroll-id=enroll --enroll-secret=enrollpw --mspid=Hospital1MSP --namespace=hblock

kubectl hlf ca enroll --name=hospital1-ca --namespace=hblock --user=admin --secret=adminpw --mspid Hospital1MSP --ca-name ca  --output hospital1-peer.yaml

kubectl hlf ca register --name=hospital2-ca --user=admin --secret=adminpw --type=admin --enroll-id=enroll --enroll-secret=enrollpw --mspid=Hospital2MSP --namespace=hblock

kubectl hlf ca enroll --name=hospital2-ca --namespace=hblock --user=admin --secret=adminpw --mspid Hospital2MSP --ca-name ca  --output hospital2-peer.yaml

10-
kubectl hlf inspect --output networkConfig.yaml -o Hospital1MSP -o OrdererMSP -o Hospital2MSP

kubectl hlf utils adduser --userPath=hospital1-peer.yaml --config=networkConfig.yaml --username=admin --mspid=Hospital1MSP

kubectl hlf utils adduser --userPath=hospital2-peer.yaml --config=networkConfig.yaml --username=admin --mspid=Hospital2MSP

11-
kubectl hlf ca register --name=ord-ca --user=orderer --secret=ordererpw --type=orderer --enroll-id=enroll --enroll-secret=enrollpw --mspid=OrdererMSP --namespace=hblock

kubectl hlf ordnode create --image=$ORDERER_IMAGE --version=$ORDERER_VERSION --storage-class=standard --enroll-id=orderer --mspid=OrdererMSP --enroll-pw=ordererpw --capacity=2Gi --name=ord-node1 --ca-name=ord-ca.hblock --namespace=hblock

kubectl hlf ca register --name=ord-ca --user=admin --secret=adminpw --type=admin --enroll-id enroll --enroll-secret=enrollpw --mspid=OrdererMSP --namespace=hblock

kubectl hlf ca enroll --name=ord-ca --namespace=hblock --user=admin --secret=adminpw --mspid OrdererMSP --ca-name ca  --output admin-ordservice.yaml

kubectl hlf ca enroll --name=ord-ca --namespace=hblock --user=admin --secret=adminpw --mspid OrdererMSP --ca-name tlsca  --output admin-tls-ordservice.yaml

kubectl hlf inspect --output ordservice.yaml -o OrdererMSP

kubectl hlf utils adduser --userPath=admin-ordservice.yaml --config=ordservice.yaml --username=admin --mspid=OrdererMSP

12-
kubectl hlf channel generate --output=blood.block --name=blood --organizations Hospital1MSP --organizations Hospital2MSP --ordererOrganizations OrdererMSP

kubectl hlf ordnode join --block=blood.block --name=ord-node1 --namespace=hblock --identity=admin-tls-ordservice.yaml

--- repeat step 10 ---

kubectl hlf channel join --name=blood --config=networkConfig.yaml --user=admin -p=hospital1-peer1.hblock

kubectl hlf channel join --name=blood --config=networkConfig.yaml --user=admin -p=hospital1-peer2.hblock

kubectl hlf channel join --name=blood --config=networkConfig.yaml --user=admin -p=hospital2-peer1.hblock

kubectl hlf channel join --name=blood --config=networkConfig.yaml --user=admin -p=hospital2-peer2.hblock

13-
kubectl hlf channel addanchorpeer --channel=blood --config=networkConfig.yaml --user=admin --peer=hospital1-peer1.hblock

kubectl hlf channel addanchorpeer --channel=blood --config=networkConfig.yaml --user=admin --peer=hospital2-peer1.hblock

14-
CC_NAME=blood-transfer

cat << METADATA-EOF > "metadata.json"
{
    "type": "ccaas",
    "label": "${CC_NAME}"
}
METADATA-EOF

cat << CONN_EOF > "connection.json"
{
  "address": "${CC_NAME}:7052",
  "dial_timeout": "10s",
  "tls_required": false
}
CONN_EOF

tar cfz code.tar.gz connection.json

tar cfz ${CC_NAME}-external.tgz metadata.json code.tar.gz

export PACKAGE_ID=$(kubectl hlf chaincode calculatepackageid --path=$CC_NAME-external.tgz --language=node --label=$CC_NAME)

kubectl hlf chaincode install --path=./${CC_NAME}-external.tgz --config=networkConfig.yaml --language=node --label=$CC_NAME --user=admin --peer=hospital1-peer1.hblock

kubectl hlf chaincode install --path=./${CC_NAME}-external.tgz --config=networkConfig.yaml --language=node --label=$CC_NAME --user=admin --peer=hospital1-peer2.hblock

kubectl hlf chaincode install --path=./${CC_NAME}-external.tgz --config=networkConfig.yaml --language=node --label=$CC_NAME --user=admin --peer=hospital2-peer1.hblock

kubectl hlf chaincode install --path=./${CC_NAME}-external.tgz --config=networkConfig.yaml --language=node --label=$CC_NAME --user=admin --peer=hospital2-peer2.hblock

15-
export IMAGE="fromearth/blood-transfer:latest"

--- when inside blood-transfer directory ---

docker build -t $IMAGE .

docker push $IMAGE

16-
--- return to hblock-ledger directory ---

kubectl hlf externalchaincode sync --image=$IMAGE --name=$CC_NAME --namespace=hblock --package-id=$PACKAGE_ID --tls-required=false --replicas=1

kubectl hlf chaincode queryinstalled --config=networkConfig.yaml --user=admin --peer=hospital1-peer1.hblock

kubectl hlf chaincode approveformyorg --config=networkConfig.yaml --user=admin --peer=hospital1-peer1.hblock --package-id=$PACKAGE_ID --version 1.0 --sequence 1 --name=$CC_NAME --policy="AND('Hospital1MSP.member', 'Hospital2MSP.member')" --channel=blood

kubectl hlf chaincode approveformyorg --config=networkConfig.yaml --user=admin --peer=hospital2-peer1.hblock --package-id=$PACKAGE_ID --version 1.0 --sequence 1 --name=$CC_NAME --policy="AND('Hospital1MSP.member', 'Hospital2MSP.member')" --channel=blood

kubectl hlf chaincode commit --config=networkConfig.yaml --user=admin --mspid=Hospital1MSP --version 1.0 --sequence 1 --name=$CC_NAME --policy="AND('Hospital1MSP.member', 'Hospital2MSP.member')" --channel=blood

17-
kubectl hlf chaincode invoke --config=networkConfig.yaml --user=admin --peer=hospital1-peer1.hblock --chaincode=$CC_NAME --channel=blood --fcn=requestBlood -a "INITIAL1" -a "Dummy Transaction" -a "" -a "true" -a "" -a ""

kubectl hlf chaincode invoke --config=networkConfig.yaml --user=admin --peer=hospital2-peer1.hblock --chaincode=$CC_NAME --channel=blood --fcn=requestBlood -a "INITIAL2" -a "Dummy Transaction" -a "" -a "true" -a "" -a ""

kubectl hlf chaincode query --config=networkConfig.yaml --user=admin --peer=hospital1-peer1.hblock --chaincode=$CC_NAME --channel=blood --fcn=getRequestsIsPublic -a ""




and there you have it, your own hyperledger fabric up and running...