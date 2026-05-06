package model

import (
	"github.com/QuantumNous/new-api/common"

	"gorm.io/gorm"
)

type Organization struct {
	Id          int            `json:"id"`
	Name        string         `json:"name" gorm:"size:128;not null;uniqueIndex:uk_org_name_delete_at,priority:1"`
	Code        string         `json:"code" gorm:"size:64;not null;uniqueIndex:uk_org_code_delete_at,priority:1"`
	Description string         `json:"description,omitempty" gorm:"type:text"`
	Status      int            `json:"status" gorm:"default:1"`
	CreatedTime int64          `json:"created_time" gorm:"bigint"`
	UpdatedTime int64          `json:"updated_time" gorm:"bigint"`
	DeletedAt   gorm.DeletedAt `json:"-" gorm:"index;uniqueIndex:uk_org_name_delete_at,priority:2;uniqueIndex:uk_org_code_delete_at,priority:2"`
}

func (o *Organization) Insert() error {
	now := common.GetTimestamp()
	o.CreatedTime = now
	o.UpdatedTime = now
	return DB.Create(o).Error
}

func (o *Organization) Update() error {
	o.UpdatedTime = common.GetTimestamp()
	return DB.Save(o).Error
}

func IsOrgNameDuplicated(id int, name string) (bool, error) {
	if name == "" {
		return false, nil
	}
	var cnt int64
	err := DB.Model(&Organization{}).Where("name = ? AND id <> ?", name, id).Count(&cnt).Error
	return cnt > 0, err
}

func IsOrgCodeDuplicated(id int, code string) (bool, error) {
	if code == "" {
		return false, nil
	}
	var cnt int64
	err := DB.Model(&Organization{}).Where("code = ? AND id <> ?", code, id).Count(&cnt).Error
	return cnt > 0, err
}

func GetOrganizationByID(id int) (*Organization, error) {
	var o Organization
	err := DB.First(&o, id).Error
	if err != nil {
		return nil, err
	}
	return &o, nil
}

func GetAllOrganizations(offset int, limit int) ([]*Organization, int64, error) {
	var orgs []*Organization
	var total int64
	if err := DB.Model(&Organization{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := DB.Offset(offset).Limit(limit).Order("id DESC").Find(&orgs).Error; err != nil {
		return nil, 0, err
	}
	return orgs, total, nil
}

func SearchOrganizations(keyword string, offset int, limit int) ([]*Organization, int64, error) {
	db := DB.Model(&Organization{})
	if keyword != "" {
		like := "%" + keyword + "%"
		db = db.Where("name LIKE ? OR code LIKE ? OR description LIKE ?", like, like, like)
	}
	var total int64
	if err := db.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var orgs []*Organization
	if err := db.Offset(offset).Limit(limit).Order("id DESC").Find(&orgs).Error; err != nil {
		return nil, 0, err
	}
	return orgs, total, nil
}

func DeleteOrganizationByID(id int) error {
	return DB.Delete(&Organization{Id: id}).Error
}
