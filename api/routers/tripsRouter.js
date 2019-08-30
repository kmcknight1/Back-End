const router = require("express").Router();

const Trips = require("../helpers/trips-model");
const TripUsers = require("../helpers/trip_users-model");
const restricted = require("../../customMiddleware/restricted-middleware");

router.get("/", (req, res) => {
  Trips.find()
    .then(trips => {
      res.json(trips);
    })
    .catch(err => res.send(err));
});

router.get("/:id", async (req, res) => {
  try {
    const trip = await Trips.findById(req.params.id);

    if (trip) {
      const tripObjects = await TripUsers.findByTripId(trip.id);

      const tripUsers = [];

      tripObjects.forEach(item => {
        tripUsers.push(item.user_id);
      });

      console.log("TRIP USERS: ", tripUsers);
      console.log("TRIP: ", trip);

      const result = {
        ...trip,
        users: tripUsers
      };

      res.status(202).json(result);
    }
  } catch (err) {}
});

router.get("/user/:id", (req, res) => {
  TripUsers.findUserTrips(req.params.id)
    .then(trips => {
      res.status(202).json(trips);
    })
    .catch(err => res.status(500).json(err));
});

router.post("/", async (req, res) => {
  const trip = req.body.trip;
  const title = trip.title;
  const description = trip.description;
  const location = trip.location;
  const start_date = trip.start_date;
  const end_date = trip.end_date;
  const usersArray = req.body.users;

  console.log("REQUEST: ", req.body);
  console.log("trip: ", trip);

  if (!trip.title || !usersArray) {
    res.status(500).json({
      message: "Must include trip title, and users array"
    });
  }

  Trips.add(trip)
    .then(saved => {
      console.log(" got here");
      //change to saved.id for postgres-------------------------------->
      const trip_id = saved.id;

      console.log("added trip");
      usersArray.forEach(user => {
        TripUsers.add(
          trip_id,
          user,
          title,
          description,
          location,
          start_date,
          end_date
        )
          .then(saved => {
            console.log(saved);
          })
          .catch(err =>
            res.status(500).json({
              err,
              message: "error adding individual trips to users"
            })
          );
      });
      res.status(201).json(saved);
    })
    .catch(err => res.status(500).json({ err, message: "error out here" }));
});

router.post("/user", (req, res) => {
  const trip = req.body;

  TripUsers.add(trip)
    .then(saved => {
      res.json(saved);
    })
    .catch(err => res.send(err));
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const changes = req.body;

  try {
    const trip = await Trips.findById(id);

    if (trip) {
      const updatedTrip = await Trips.update(changes, id);
      res.json(updatedTrip);
    } else {
      res.status(404).json({ message: "Could not find trip with given ID" });
    }
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Trips.remove(id);

    if (deleted) {
      res.json({ removed: deleted });
    } else {
      res.status(404).json({ message: "Could not find trip with given ID" });
    }
  } catch (err) {
    res.status(500).json({ message: "Something went wrong" });
  }
});

module.exports = router;
