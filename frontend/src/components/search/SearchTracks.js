import React, { useEffect, useState } from 'react';
import SpotifyWebApi from 'spotify-web-api-node';
import AddTrack from '../profile-forms/AddTrack';
import { connect } from 'react-redux';
import { getAccessToken, getCurrentProfile } from '../../actions/profile';
import TracksListening from '../posts/TracksListening';

const SearchTracks = ({
  accessToken,
  profile: { profile },
  getAccessToken,
  getCurrentProfile,
  setPlayingTrack,
}) => {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [tracks, setTracks] = useState([]);

  // Make new instance of Spotify API
  const spotifyApi = new SpotifyWebApi();

  //Get Spotify Key at start up
  useEffect(() => {
    getAccessToken();
    if (!profile) getCurrentProfile();
    if (profile) {
      setTracks(profile['tracks']);
      console.log(tracks);
    }
  }, [profile]);

  // Get another Spotify Key after every one hour expiration time
  useEffect(() => {
    const interval = setInterval(() => {
      getAccessToken();
    }, 1000 * 60 * 60); // one hour

    return () => clearInterval(interval); // unmount & cleanup
  }, [accessToken]);

  useEffect(() => {
    console.log(search);
  }, [search]);

  useEffect(() => {
    if (!search) return setSearchResults([]);
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.searchTracks(search, { limit: 5 }).then(
      function (data) {
        console.log(data.body.tracks.items);
        setSearchResults(
          data.body.tracks.items.map((track) => {
            const smallestAlbumImage = track.album.images.reduce(
              (smallest, image) => {
                if (image.height < smallest.height) return image;
                return smallest;
              },
              track.album.images[0]
            );

            return {
              artist: track.artists[0].name,
              title: track.name,
              id: track.id,
              albumUrl: smallestAlbumImage.url,
              album: track.album.name,
            };
          })
        );
      },
      function (err) {
        console.error(err);
      }
    );
  }, [search, accessToken]);

  return (
    <div className='flex justify-center items-center'>
      <form
        className='form'
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      >
        <div className='flex flex-col '>
          <div className='form-group'>
            <input
              type='text'
              className='w-full focus:shadow focus:outline-none'
              placeholder='Search Any Tracks'
            />
          </div>
          <div className='overflow-scroll flex flex-col'>
            {setPlayingTrack
              ? searchResults.map((track) => (
                  <TracksListening
                    track={track}
                    key={track.id}
                    setPlayingTrack={setPlayingTrack}
                    setSearchResults={setSearchResults}
                  />
                ))
              : searchResults
                  .filter((x) => !tracks.map((y) => y.spot_id).includes(x.id))
                  .map((track) => (
                    <AddTrack
                      track={track}
                      key={track.id}
                      setSearchResults={setSearchResults}
                    />
                  ))}
          </div>
        </div>
      </form>
    </div>
  );
};

const mapStateToProps = (state) => ({
  accessToken: state.profile.accessToken,
  profile: state.profile,
});

export default connect(mapStateToProps, { getAccessToken, getCurrentProfile })(
  SearchTracks
);
