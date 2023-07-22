const express = require('express')
//  const fetch = import('node-fetch')
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const redis = require('redis')

const PORT = process.env.PORT || 5000 
const REDIS_PORT = process.env.PORT || 6379

const client = redis.createClient(REDIS_PORT);
(async()=>{
  try{
    await client.connect()
  }catch(err) {
    console.log(err);
  }
})();


const app = express()


// set response function 

function setResponse(username, repos) {
  return `${username} has ${repos} Github repos`
}
// Make request to Github for data
async function getRepos(req, res) {

  try {
    console.log('fetching data...');
    const { username } = req.params
    const response = await fetch(`https://api.github.com/users/${username}`)
    const data = await response.json()
    // res.send(data)
    const repos = data.public_repos
    await client.set(username, repos )
    return res.send(setResponse(username, repos))
  } catch (error) {
    console.error(error);
    return res.status(500)
  }
}
// cahe middleware 
async function cache(req, res, next) {
  const { username } = req.params
  const data = await client.get(username)
    if(data != null) 
      return res.send(setResponse(username, data))
      
      next()
}
app.get('/repos/:username',cache,getRepos)

app.listen(PORT, console.log(`Server running on port ${PORT}`))