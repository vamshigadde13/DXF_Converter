using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.XR.ARFoundation;
using UnityEngine.XR.ARSubsystems;


public class placementIndicator : MonoBehaviour
{
    private ARRaycastManager rm;
    private GameObject visual;
    void Start()
    {
        rm = FindObjectOfType<ARRaycastManager>();
        visual = transform.GetChild(0).gameObject;

        visual.SetActive(false);
    }

    void Update()
    {
        List<ARRaycastHit> hits = new List<ARRaycastHit>();
        rm.Raycast(new Vector2(Screen.width/2,Screen.height/2),hits,TrackableType.Planes);

        if (hits.Count>0)
        {
            transform.position = hits[0].pose.position;
            transform.rotation = hits[0].pose.rotation;
            if (!visual.activeInHierarchy)
            {
                visual.SetActive(true);
            }
        }else
        {
            visual.SetActive(false);
        }


    }
}
